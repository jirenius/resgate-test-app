const NATS = require('nats');

const errResponseInvalidParams = JSON.stringify({ error: { code: 'system.invalidParams', message: "Invalid parameters" }});
const actionDelete = { action: 'delete' };

let model = {
	name: "value"
};

let nats = NATS.connect("nats://localhost:4222");

// Access listener
nats.subscribe('access.dynamicService.model', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: {
		get: true,
		call: "set"
	}}));
});

// Get listener
nats.subscribe('get.dynamicService.model', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { model }}));
});

// Set listener
nats.subscribe('call.dynamicService.model.set', (request, replyTo, subject) => {
	let req = JSON.parse(request);
	let p = req.params || {};

	let change = {};
	for (let key in p) {
		let v = p[key];
		if (v !== null && typeof v === 'object') {
			// Only allow delete actions
			if (v.action !== 'delete' || v.rid) {
				nats.publish(replyTo, errResponseInvalidParams);
			}
			if (model[key] !== undefined) {
				change[key] = actionDelete;
			}
		} else if (model[key] !== p[key]) {
			change[key] = p[key];
		}
	}

	if (Object.keys(change).length) {
		Object.assign(model, change);
		// Delete deleted properties from model
		Object.keys(model).forEach(key => model[key] === actionDelete && delete model[key]);

		nats.publish('event.dynamicService.model.change', JSON.stringify({ values: change }));
	}
	nats.publish(replyTo, JSON.stringify({ result: null }));
});

nats.publish('system.reset', JSON.stringify({ resources: [ 'dynamicService.>' ] }));
