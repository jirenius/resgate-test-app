const NATS = require('nats');
let nats = NATS.connect("nats://localhost:4222");

let collection = [
	true,
	false,
	"text",
	42
];

// Access listener
nats.subscribe('access.primitivesService.>', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { get: true }}));
});

// Get listener
nats.subscribe('get.primitivesService.collection', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { collection }}));
});

nats.publish('system.reset', JSON.stringify({ resources: [ 'primitivesService.>' ] }));
