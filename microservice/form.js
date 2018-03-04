const obj = require('modapp-utils/obj');
const NATS = require('nats');

let OBJ_DEF = {
	input: { type: 'string' },
	select: { type: 'string' },
	checkbox: { type: 'boolean' },
	textarea: { type: 'string' }
};

let form = obj.copy({}, OBJ_DEF);

let nats = NATS.connect("nats://localhost:4222");

// Access listener
nats.subscribe('access.formService.>', (request, replyTo, subject) => {
	let r = JSON.parse(request);
	let isLogged = r.token ? true : false;

	nats.publish(replyTo, JSON.stringify({ result: {
		get: true,
		call: isLogged ? "*" : "set"
	}}));
});

// Get listener
nats.subscribe('get.formService.form', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { model: form }}));
});

// Set listener
nats.subscribe('call.formService.form.set', (request, replyTo, subject) => {
	let req = JSON.parse(request);
	let p = req.params || {};
	let change = null;
	try {
		change = obj.update(form, p, OBJ_DEF);
	} catch (ex) {
		nats.publish(replyTo, JSON.stringify({ error: { code: 'system.invalidParams', message: "Invalid parameters: " + ex }}));
		return;
	}

	if (change) {
		for (let key in change) {
			change[key] = form[key];
		}
		nats.publish('event.formService.form.change', JSON.stringify(change));
	}
	nats.publish(replyTo, JSON.stringify({ result: null }));
});

nats.publish('system.reset', JSON.stringify({ resources: [ 'formService.>' ] }));
