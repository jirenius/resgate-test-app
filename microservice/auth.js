const NATS = require('nats');
const crypto = require('crypto');

let nats = NATS.connect("nats://localhost:4222");

let users = {
	admin: { id: 42, name: 'Administrator', role: 'admin', password: 'admin123' },
	guest: { id: 10, name: 'Honored guest', role: 'guest', password: 'guest' }
};

const EXPIRE_DURATION = 2 * 60 * 1000; // Token expires after 2 min. Should be renewed after 1 min.

let tokenKeys = {};
let sessions = {};
let cids = {};

// Login auth listener
nats.subscribe('auth.authService.login', (request, replyTo, subject) => {
	let { params, cid, token } = parseRequest(request);

	if (token) {
		nats.publish(replyTo, JSON.stringify({ error: { code: 'authService.alreadyLoggedIn', message: "Already logged in" }}));
		return;
	}

	if (!params ||
		typeof params.username !== 'string' ||
		typeof params.password !== 'string'
	) {
		nats.publish(replyTo, JSON.stringify({ error: { code: 'system.invalidParams', message: "Invalid parameters" }}));
		return;
	}

	let user = validateCredentials(params);
	if (!user) {
		nats.publish(replyTo, JSON.stringify({ error: { code: 'authService.wrongUsernamePassword', message: "Wrong username or password" }}));
		return;
	}

	let sid = generateSessionID();
	let session = { sid, user, cid, created: new Date(), tokens: [] };
	sessions[sid] = session;

	sendLoginReply(replyTo, session);
});

// Relogin auth listener
nats.subscribe('auth.authService.relogin', (request, replyTo, subject) => {
	let { params, cid } = parseRequest(request);

	if (!params ||
		typeof params.tokenKey !== 'string'
	) {
		nats.publish(replyTo, JSON.stringify({ error: { code: 'authService.invalidParams', message: "Invalid parameters" }}));
		return;
	}

	let session = tokenKeys[params.tokenKey];
	if (session) {
		let lastToken = session.tokens[session.tokens.length - 1];
		// It should be the last issued token key.
		// If not, then it has been used two times and might be a stolen tokenKey.
		// Let's dispose the session all together, just to be sure.
		if (lastToken.tokenKey !== params.tokenKey) {
			disposeSession(session);
			session = null;
		}
	}

	if (!session) {
		nats.publish(replyTo, JSON.stringify({ error: { code: 'authService.invalidTokenKey', message: "Invalid token key" }}));
		return;
	}

	// Associate the session with the new cid
	session.cid = cid;

	sendLoginReply(replyTo, session);
});

// Access listener
nats.subscribe('access.authService', (request, replyTo, subject) => {
	let { token } = JSON.parse(request);
	let isAdmin = token && token.role === 'admin';

	nats.publish(replyTo, JSON.stringify({ result: { call: isAdmin ? "*" : null }}));
});

// User access listener
// Listens to get requests for connection specific user info. Eg. access.authService.conn.XXXX
// Access is only granted if the cid matches that of the request.
nats.subscribe('access.authService.user.*', (request, replyTo, subject) => {
	let { cid } = JSON.parse(request);
	nats.publish(replyTo, JSON.stringify({ result: { get: cid === subject.substr(24) }}));
});

// User get listener
nats.subscribe('get.authService.user.*', (request, replyTo, subject) => {
	let cid = subject.substr(21);
	let session = cids[cid];
	if (!session) {
		nats.publish(replyTo, JSON.stringify({ result: { model: { id: null, name: null, role: null }}}));
	} else {
		let { user } = session;
		nats.publish(replyTo, JSON.stringify({ result: { model: {
			id: user.id,
			name: user.name,
			role: user.role
		}}}));
	}
});

// Logout auth listener
nats.subscribe('auth.authService.logout', (request, replyTo, subject) => {
	let { cid } = JSON.parse(request);
	let session = cids[cid];
	if (session) {
		disposeSession(session);
	}

	nats.publish(replyTo, JSON.stringify({ result: null }));
});

// Logout guests
nats.subscribe('call.authService.logoutGuests', (request, replyTo, subject) => {
	let toDispose = [];
	for (let sid in sessions) {
		let session = sessions[sid];
		if (session.user.role === 'guest') {
			toDispose.push(session);
		}
	}

	toDispose.forEach(session => {
		console.log("Kicking user: " + session.sid);
		disposeSession(session);
	});

	nats.publish(replyTo, JSON.stringify({ result: null }));
});

// Login auth listener
nats.subscribe('auth.authService.headerLogin', (request, replyTo, subject) => {
	console.log("HeaderLogin: ", request);

	let req = JSON.parse(request);
	if (req && typeof req === 'object' && req.header && typeof req.header === 'object' && req.header.Authorization) {
		auths = req.header.Authorization;

		for (let auth of auths) {
			if (!auth.lastIndexOf("Basic ", 0) === 0) {
				continue;
			}
			auth = auth.substr(6);
			let str = (new Buffer(auth, 'base64')).toString('utf8');

			console.log("Decoded Authorization: ", str);

			let idx = str.indexOf(':');
			let p = idx < 0
				? { username: str, password: '' }
				: { username: str.substr(0, idx), password: str.substr(idx + 1) };

			let user = validateCredentials(p);
			if (!user) {
				continue;
			}

			console.log("User found!");
			nats.publish(replyTo, JSON.stringify({ token: { sid: null, userId: user.id, role: user.role }}));
			return;
		}
	}

	console.log("Failed to log in");
	nats.publish(replyTo, JSON.stringify({ error: { code: 'authService.wrongUsernamePassword', message: "Wrong username or password" }}));
});

let parseRequest = function(request) {
	let req = JSON.parse(request);
	return {
		params: req && typeof req === 'object' && req.params && typeof req.params === 'object'
			? req.params
			: null,
		token: req.token || null,
		cid: req.cid
	};
};

let validateCredentials = function(params) {
	let user = users[params.username.toLowerCase()];
	if (!user) {
		return null;
	}

	return user.password === params.password
		? user
		: null;
};

let generateToken = function() {
	while (true) {
		var key = crypto.randomBytes(24).toString('base64');
		// For correctness sake
		if (!tokenKeys[key]) {
			return key;
		}
	}
};

let generateSessionID = function() {
	while (true) {
		var sid = crypto.randomBytes(24).toString('base64');
		// For correctness sake
		if (!sessions[sid]) {
			return sid;
		}
	}
};

let sendLoginReply = function(replyTo, session) {
	let { user, cid, tokens, sid } = session;
	// Revoke the token for connections on the old tokenKey
	let tokenLen = tokens.length;
	let reissue = false;
	if (tokenLen) {
		let token = tokens[tokenLen - 1];
		reissue = cid === token.cid;
		//  Is it the session continued by a new connection?
		if (!reissue) {
			// Remove token from the old connection just to be sure
			nats.publish('conn.' + token.cid + '.token', JSON.stringify({ token: null }));
			delete cids[token.cid];
		}
	}

	// Clear last expire timeout and set a new
	if (session.expireId) {
		clearTimeout(session.expireId);
	}
	session.expireId = setTimeout(() => disposeSession(session), EXPIRE_DURATION);

	let tokenKey = generateToken();

	tokens.push({ tokenKey, cid, issued: new Date() });

	tokenKeys[tokenKey] = session;
	cids[cid] = session;

	// Send a new token to the connection
	nats.publish('conn.' + cid + '.token', JSON.stringify({ token: { sid, userId: user.id, role: user.role }}));
	// Update the conn user model unless it is a reissue
	if (!reissue) {
		nats.publish('event.authService.user.' + cid + '.change', JSON.stringify({ id: user.id, name: user.name, role: user.role }));
	}
	// Respond with the token key
	nats.publish(replyTo, JSON.stringify({ result: { tokenKey }}));
};

let disposeSession = function(session) {
	let { cid, tokens, sid } = session;
	clearTimeout(session.expireId);

	let token = tokens[tokens.length - 1];

	// Clear the conn user model
	nats.publish('event.authService.user.' + cid + '.change', JSON.stringify({ id: null, name: null, role: null }));
	// Remove token from the last connection
	nats.publish('conn.' + cid + '.token', JSON.stringify({ token: null }));

	while (token) {
		delete tokenKeys[token.tokenKey];
		token = tokens.pop();
	}

	delete cids[cid];
	delete sessions[sid];
};
