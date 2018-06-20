const NATS = require('nats');
const QueryCollection = require('./class/QueryCollection.js');

let nats = NATS.connect("nats://localhost:4222");

let notes = new QueryCollection(nats, 'notesService.notes', 'notesService.note.', {
	data: [
		{ id: 1, message: "One" },
		{ id: 2, message: "Two" },
		{ id: 3, message: "Three" },
		{ id: 4, message: "Four" },
		{ id: 5, message: "Five" },
		{ id: 6, message: "Six" },
		{ id: 7, message: "Seven" },
		{ id: 8, message: "Eight" },
		{ id: 9, message: "Nine" },
		{ id: 10, message: "Ten" }
	]
});

let incrementalId = 10;

// Access listener
nats.subscribe('access.notesService.>', (request, replyTo, subject) => {
	nats.publish(replyTo, JSON.stringify({ result: { get: true, call: '*' }}));
});

// New listener
nats.subscribe('call.notesService.notes.new', (request, replyTo, subject) => {
	let req = JSON.parse(request);
	let p = req.params || {};
	let note = { id: ++incrementalId, message: p.message || "" };

	notes.add(note);
	nats.publish(replyTo, JSON.stringify({ result: { rid: 'notesService.note.' + note.id }}));
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
