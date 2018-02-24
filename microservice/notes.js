const NATS = require('nats');
const QueryCollection = require('./QueryCollection.js');

let nats = NATS.connect("nats://localhost:4222");


let notes = new QueryCollection(nats, 'notesService.notes', 'notesService.note.', {
	data: [
		{ id: 10, message: "Ten" },
		{ id: 20, message: "Twenty" },
		{ id: 30, message: "Thirty" },
		{ id: 40, message: "Fourty" },
		{ id: 50, message: "Fifty" },
		{ id: 60, message: "Sixty" },
		{ id: 70, message: "Seventy" },
		{ id: 80, message: "Eighty" },
		{ id: 90, message: "Ninety" },
		{ id: 100, message: "Hundred" }
	]
});

// Access listener
nats.subscribe('access.notesService.>', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { get: true }}));
});

nats.publish('system.reset', JSON.stringify({ resources: [ 'notesService.>' ] }));

var cycle = function() {
	let storedNote;
	setTimeout(() => {
		storedNote = notes.removeByIndex(notes.length - 1);
		notes.add(storedNote, 0);
		cycle();
	}, 2000);
};

cycle();
