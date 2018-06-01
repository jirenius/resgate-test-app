const NATS = require('nats');
let nats = NATS.connect("nats://localhost:4222");

let model = {
	notes: { rid: 'notesService.notes?start=0&limit=5' },
	primitives: { rid: 'primitivesService.collection' },
	clickField: { rid: 'clickService.clickField' }
};

let collection = [
	{ rid: 'tickerService.ticker' },
	{ rid: 'complexService.model' }
];

// Access listener
nats.subscribe('access.complexService.>', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { get: true }}));
});

// Get collection listener
nats.subscribe('get.complexService.collection', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { collection }}));
});

// Get model listener
nats.subscribe('get.complexService.model', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { model }}));
});

nats.publish('system.reset', JSON.stringify({ resources: [ 'complexService.>' ] }));
