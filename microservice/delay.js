const NATS = require('nats');
let nats = NATS.connect("nats://localhost:4222");

const errNotFound = JSON.stringify({ error: { code: 'system.notFound', message: "Not found" }});
const errInvalidParams = JSON.stringify({ error: { code: 'system.invalidParams', message: "Invalid parameters" }});

function isNum(v) {
	return v === '0' || v.match(/^[1-9][0-9]*$/);
}

// Access listener
nats.subscribe('access.delayService.>', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { get: true }}));
});

// Call access listener
nats.subscribe('access.delayService', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { get: false, call: '*' }}));
});

// Get listener for delayService.model.<delay>
nats.subscribe('get.delayService.model.*', (request, replyTo, subject) => {
	let ms = subject.substr(23); // "get.delayService.model.".length;

	// Enforce time format
	if (!isNum(ms)) {
		return nats.publish(replyTo, errNotFound);
	}

	ms = parseInt(ms);
	setTimeout(() => nats.publish(replyTo, JSON.stringify({ result: { model: {
		delay: ms
	}}})), ms);
});

// Get listener for delayService.model.<delay>.<timeout>
nats.subscribe('get.delayService.model.*.*', (request, replyTo, subject) => {
	let parts = subject.substr(23).split('.'); // "get.delayService.model.".length;
	let ms = parts[0];
	let timeout = parts[1];

	// Enforce time format
	if (!isNum(ms) || !isNum(timeout)) {
		return nats.publish(replyTo, errNotFound);
	}

	nats.publish(replyTo, 'timeout:"' + timeout + '"');

	ms = parseInt(ms);
	setTimeout(() => nats.publish(replyTo, JSON.stringify({ result: { model: {
		delay: ms,
		timeout
	}}})), ms);
});

function validateParams(req) {
	if (!req || typeof req !== 'object') {
		return false;
	}

	let p = req.params;
	return p && typeof p === 'object'
		&& typeof p.delay === 'number'
		&& typeof p.timeout === 'number';
};

// Wait call listener
nats.subscribe('call.delayService.wait', (rawRequest, replyTo, subject) => {
	let req = JSON.parse(rawRequest);
	if (!validateParams(req)) {
		return nats.publish(replyTo, errInvalidParams);
	}

	nats.publish(replyTo, 'timeout:"' + req.params.timeout + '"');

	setTimeout(() => {
		nats.publish(replyTo, JSON.stringify({ result: null }));
	}, req.params.delay);
});

nats.publish('system.reset', JSON.stringify({ resources: [ 'delayService.>' ] }));
