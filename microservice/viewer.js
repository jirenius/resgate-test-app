const NATS = require('nats');
let nats = NATS.connect("nats://localhost:4222");

const errNotFound = JSON.stringify({ error: { code: 'system.notFound', message: "Not found" }});

let models = {
	"model": {
		notes: { rid: 'notesService.notes?start=0&limit=5' },
		primitives: { rid: 'viewerService.primitives' },
		clickField: { rid: 'clickService.clickField' },
		dynamic: { rid: 'dynamicService.model' },
		note: { rid: 'notesService.note.1' },
		cycle: { rid: 'viewerService.cyclic.a' }
	},
	"cyclic.a": {
		refToB: { rid: 'viewerService.cyclic.b' },
	},
	"cyclic.b": {
		refToA: { rid: 'viewerService.cyclic.a' },
		refToB: { rid: 'viewerService.cyclic.b' }
	}
};

let collections = {
	"collection": [
		{ rid: 'tickerService.ticker' },
		{ rid: 'viewerService.model' },
		{ rid: 'viewerService.unknown' }
	],
	"primitives": [
		true,
		false,
		"text",
		42,
		null
	]
};

// Access listener
nats.subscribe('access.viewerService.>', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { get: true }}));
});

// Get listener
nats.subscribe('get.viewerService.>', (request, replyTo, subject) => {
	let id = subject.substr(18); // "get.viewerService.".length;

	let model = models[id];
	if (model) {
		return nats.publish(replyTo, JSON.stringify({ result: { model }}));
	}

	let collection = collections[id];
	if (collection) {
		return nats.publish(replyTo, JSON.stringify({ result: { collection }}));
	}

	nats.publish(replyTo, errNotFound);
});

nats.publish('system.reset', JSON.stringify({ resources: [ 'viewerService.>' ] }));

let changeNote = function() {
	setTimeout(() => {
		let note = models['model'].note;
		let nextId = parseInt(note.rid.substr(('notesService.note.').length)) + 1;
		if (nextId > 10) {
			nextId = 1;
		}
		note.rid = 'notesService.note.' + nextId;
		nats.publish('event.viewerService.model.change', JSON.stringify({ values: { note }}));
		changeNote();
	}, 5000);
};

changeNote();
