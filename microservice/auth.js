const NATS = require('nats');
const crypto = require('crypto');

let nats = NATS.connect("nats://localhost:4222");

let users = {
	admin: { id: 42, name: 'Administrator', role: 'admin', password: 'admin123' },
	guest: { id: 10, name: 'Honored guest', role: 'guest', password: 'guest' }
};

let tokenKeys = {};

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

let generateTokenKey = function() {
	while (true) {
		var key = crypto.randomBytes(24).toString('base64');
		// For correctness sake
		if (!tokenKeys[key]) {
			return key;
		}
	}
};

let revokeToken = function(token) {
	token.invalid = true;
	nats.publish('conn.' + token.cid + '.token', JSON.stringify({ token: null, data: { message: "Forcefully logged out" }}));
};

let sendLoginReply = function(replyTo, user, cid, oldTokenKey) {
	let tokenKey = generateTokenKey();
	console.log("TokenKey: ", tokenKey);

	tokenKeys[tokenKey] = { user, cid, issued: new Date(), oldTokenKey };

	if (oldTokenKey) {
		let oldToken = tokenKeys[oldTokenKey];
		oldToken.newTokenKey = tokenKey;
		revokeToken(oldToken);
	}

	nats.publish(replyTo, JSON.stringify({ token: { userId: user.id, role: user.role }, result: { tokenKey, userId: user.id, name: user.name, role: user.role }}));
};

// Access listener
nats.subscribe('access.authService', (request, replyTo, subject) => {
	let { token } = JSON.parse(request);
	let isAdmin = token && token.role === 'admin';

	nats.publish(replyTo, JSON.stringify({ result: { call: isAdmin ? "*" : null }}));
});

// Login auth listener
nats.subscribe('auth.authService.login', (request, replyTo, subject) => {
	let { params, cid } = parseRequest(request);
	if (!params ||
		typeof params.username !== 'string' ||
		typeof params.password !== 'string'
	) {
		nats.publish(replyTo, JSON.stringify({ error: { code: 'authService.invalidParams', message: "Invalid parameters" }}));
		return;
	}

	let user = validateCredentials(params);
	if (!user) {
		nats.publish(replyTo, JSON.stringify({ error: { code: 'authService.wrongUsernamePassword', message: "Wrong username or password" }}));
		return;
	}

	sendLoginReply(replyTo, user, cid);
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

	let t = tokenKeys[params.tokenKey];
	if (!t || t.invalid) {
		if (t) {
			// [TODO]
			// Someone is trying to reuse an old/used token
			// Revoke any tokenKey up the chain
			// .. when it is possible to revoke
		}
		nats.publish(replyTo, JSON.stringify({ error: { code: 'authService.invalidTokenKey', message: "Invalid token key" }}));
		return;
	}

	sendLoginReply(replyTo, t.user, cid, params.tokenKey);
});

// Logout guests
nats.subscribe('call.authService.logoutGuests', (request, replyTo, subject) => {
	for (let key in tokenKeys) {
		let token = tokenKeys[key];
		if (!token.invalid && token.user.role !== 'admin') {
			revokeToken(token);
		}
	}

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
			nats.publish(replyTo, JSON.stringify({ token: { userId: user.id, role: user.role }}));
			return;
		}
	}

	console.log("Failed to log in");
	nats.publish(replyTo, JSON.stringify({ error: { code: 'authService.wrongUsernamePassword', message: "Wrong username or password" }}));
});

// Logout auth listener
nats.subscribe('auth.authService.logout', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ token: null, result: null }));
});
