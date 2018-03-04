const NATS = require('nats');

let clickField = {
	clickCount: 0
};

let nats = NATS.connect("nats://localhost:4222");

let validateParams = function(req) {
	if (!req || typeof req !== 'object') {
		return false;
	}

	let params = req.params;
	return params &&
		typeof params === 'object' &&
		typeof params.xpos === 'number' &&
		typeof params.ypos === 'number';
};

// Access listener
nats.subscribe('access.clickService.>', (request, replyTo, subject) => {
	let { token } = JSON.parse(request);
	let isLogged = Boolean(token && token.role);

	nats.publish(replyTo, JSON.stringify({ result: { get: true, call: isLogged ? "*" : null }}));
});

// Get listener
nats.subscribe('get.clickService.clickField', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { model: clickField }}));
});

// Click call listener
nats.subscribe('call.clickService.clickField.click', (rawRequest, replyTo, subject) => {
	let request = JSON.parse(rawRequest);
	if (!validateParams(request)) {
		nats.publish(replyTo, JSON.stringify({ error: { code: 'clickService.invalidParams', message: "Invalid parameters" }}));
		return;
	}

	clickField.clickCount++;

	let params = request.params;
	nats.publish('event.clickService.clickField.click', JSON.stringify({ xpos: params.xpos, ypos: params.ypos }));
	nats.publish('event.clickService.clickField.change', JSON.stringify({ clickCount: clickField.clickCount }));
	nats.publish(replyTo, JSON.stringify({ result: null }));
});

nats.publish('system.reset', JSON.stringify({ resources: [ 'clickService.>' ] }));
