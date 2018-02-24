const NATS = require('nats');

let ticker = {
	accessible: true,
	count: 0
};

let nats = NATS.connect("nats://localhost:4222");

// Access listener
nats.subscribe('access.tickerService.>', (request, replyTo, subject) => {
	let r = JSON.parse(request);
	let isAdmin = r.token && r.token.role === 'admin';

	nats.publish(replyTo, JSON.stringify({ result: {
		get: Boolean(r.token || ticker.accessible),
		call: isAdmin ? "*" : null
	}}));
});

// Get listener
nats.subscribe('get.tickerService.ticker', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { model: ticker }}));
});

// Set listener
nats.subscribe('call.tickerService.ticker.set', (request, replyTo, subject) => {
	let req = JSON.parse(request);
	let p = req.params || {};
	let change = {};
	if (typeof p.accessible === 'boolean' && p.accessible !== ticker.accessible) {
		change.accessible = p.accessible;
		if (!p.accessible) {
			nats.publish('event.tickerService.ticker.reaccess');
		}
	}

	if (Object.keys(change).length) {
		Object.assign(ticker, change);
		nats.publish('event.tickerService.ticker.change', JSON.stringify({ data: change }));
	}
	nats.publish(replyTo, JSON.stringify({ result: null }));
});

nats.publish('system.reset', JSON.stringify({ resources: [ 'tickerService.>' ] }));

let count = function() {
	setTimeout(() => {
		ticker.count++;
		nats.publish('event.tickerService.ticker.change', JSON.stringify({ data: { count: ticker.count }}));
		count();
	}, 1000);
};

count();
