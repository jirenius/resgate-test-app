const url = require('url');

const EVENT_QUERY_DURATION = 1000 * 60; // 1 min
const ERR_NOT_FOUND = JSON.stringify({ error: { code: 'system.notFound', message: "Not found" }});
const NO_QUERY_EVENTS = JSON.stringify({ result: { events: [] }});

class QueryCollection {

	/**
	 * Creates a new QueryCollection instance
	 * @param {object} nats NATS client
	 * @param {string} resourceName Collection resource name
	 * @param {string} modelPrefix Model prefix
	 * @param {object} [opt] Optional parameters
	 * @param {function} [opt.modelResourceName] Resource name callback function. Defaults to m => modelPrefix + m.id
	 * @param {object} [opt.data] Array of initial data
	 */
	constructor(nats, resourceName, modelPrefix, opt) {
		this.nats = nats;
		this.resourceName = resourceName;
		this.modelPrefix = modelPrefix;

		opt = Object.assign({}, opt);
		this.list = opt.data || [];
		this.modelResourceName = opt.modelResourceName
			? opt.modelResourceName
			: m => { return this.modelPrefix + m.id; };

		// Bind callbacks
		this._unsubscribeEvent = this._unsubscribeEvent.bind(this);

		this.eventId = 0;
		this.events = null;

		this._initMap();
		this._subscribe();
	}

	get length() {
		return this.list.length;
	}

	getCollection(start, limit) {
		if (start === undefined) {
			return this.list.map(this.modelResourceName);
		}

		try {
			start = start ? parseInt(start, 10) : 0;
			limit = limit ? parseInt(limit, 10) : 0;
		} catch (ex) {
			return null;
		}

		return this.list
			.slice(start, limit ? start + limit : undefined)
			.map(this.modelResourceName);
	}

	getModel(resourceId) {
		return this.map[resourceId] || null;
	}

	add(model, idx) {
		idx = Number(idx);
		if (Number.isNaN(idx) || idx < 0 || idx > this.list.length) {
			console.error("Index out of bounds - ", model, idx);
			return;
		}

		this.list.splice(idx, 0, model);
		let resourceId = this.modelResourceName(model);
		this.map[resourceId] = model;

		let subject = this._createQueryInbox('add', resourceId, idx);
		this.nats.publish('event.' + this.resourceName + '.add', JSON.stringify({ rid: resourceId, idx }));
		this.nats.publish('event.' + this.resourceName + '.query', JSON.stringify({ subject }));
	}

	removeByIndex(idx) {
		if (idx < 0 || idx >= this.list.length) {
			console.error("Index out of bounds - ", idx);
			return;
		}

		let model = this.list[idx];

		this.list.splice(idx, 1);
		let resourceId = this.modelResourceName(model);
		delete this.map[resourceId];

		let subject = this._createQueryInbox('remove', resourceId, idx);
		this.nats.publish('event.' + this.resourceName + '.remove', JSON.stringify({ rid: resourceId, idx }));
		this.nats.publish('event.' + this.resourceName + '.query', JSON.stringify({ subject }));
		return model;
	}

	_createQueryInbox(event, resourceId, idx) {
		let querySubject = this.nats.createInbox();
		let id = this.eventId++;

		let queryEvent = {
			id,
			sid: this.nats.subscribe(querySubject, this._handleEventQuery.bind(this, id)),
			timestamp: Date.now(),
			querySubject,
			event,
			resourceId,
			idx
		};

		if (!this.events) {
			this.events = [ queryEvent ];
			this._setEventTimeout();
		} else {
			this.events.push(queryEvent);
		}

		return querySubject;
	}

	_setEventTimeout() {
		let duration = this.events[0].timestamp + EVENT_QUERY_DURATION - Date.now();
		if (duration <= 0) {
			this._unsubscribeEvent();
		} else {
			setTimeout(this._unsubscribeEvent, duration);
		}
	}

	_unsubscribeEvent() {
		let event = this.events.shift();
		this.nats.unsubscribe(event.sid);

		if (this.events.length > 0) {
			this._setEventTimeout();
		} else {
			this.events = null;
		}
	}

	_handleEventQuery(eventId, request, replyTo) {
		try {
			let idx = eventId + this.events.length - this.eventId;
			let event = this.events[idx];
			let req = request ? JSON.parse(request) : {};

			let q = this._parseQuery(req.query);
			if (!q) {
				throw "Invalid query";
			}
			let start = q.start;
			let end = q.limit ? q.start + q.limit : 0;

			// Is the event out of scope
			if (event.idx >= end && end !== 0) {
				return this.nats.publish(replyTo, NO_QUERY_EVENTS);
			}

			let offset = event.event === 'add' ? 1 : 0;
			let events;
			if (event.idx >= start) {
				events = [{
					event: event.event,
					data: {
						rid: event.resourceId,
						idx: event.idx - start
					}
				}];
			} else {
				events = [{
					event: event.event,
					data: {
						rid: this._getPastResourceIdAt(idx, start - offset),
						idx: 0
					}
				}];
			}

			if (q.limit) {
				let resourceId = this._getPastResourceIdAt(idx, end - offset);
				if (resourceId !== null) {
					events.push({
						event: event.event === 'add' ? 'remove' : 'add',
						data: {
							rid: resourceId,
							idx: q.limit - 1 + offset
						}
					});
				}
			}

			this.nats.publish(replyTo, JSON.stringify({ result: { events }}));
		} catch (ex) {
			console.error("Error handling event query: ", ex.message);
			this.nats.publish(replyTo, ERR_NOT_FOUND);
			return;
		}

	}

	_getPastResourceIdAt(eventIdx, idx) {
		let elen = this.events.length,
		    llen = this.list.length,
			start = idx - elen,
			end = idx + elen + 1,
			i;

		// Create fixed size slice
		let arr = new Array(end - start);
		for (i = start; i < end; i++) {
			arr[i - start] = i < 0 || i >= llen
				? null
				: this.modelResourceName(this.list[i]);
		}

		for (i = elen - 1; i >= eventIdx; i--) {
			let ev = this.events[i];
			if (ev.idx >= end) {
				continue;
			}

			if (ev.event === 'add') {
				if (ev.idx < start) {
					elen++;
				} else {
					arr.splice(ev.idx - start, 1);
				}
			} else {
				if (ev.idx < start) {
					elen--;
				} else {
					arr.splice(ev.idx - start, 0, ev.resourceId);
				}
			}
		}

		return arr[elen];
	}

	_initMap() {
		this.map = {};
		for (let m of this.list) {
			this.map[this.modelResourceName(m)] = m;
		}
	}

	_subscribe() {
		this.nats.subscribe('get.' + this.resourceName, this._handleGetCollection.bind(this));
		this.nats.subscribe('get.' + this.modelPrefix + '*', this._handleGetModel.bind(this));
	}

	_handleGetCollection(request, replyTo, subject) {
		try {
			let req = request ? JSON.parse(request) : {};
			let q = this._parseQuery(req.query);
			if (!q) {
				this.nats.publish(replyTo, ERR_NOT_FOUND);
			} else {
				let collection = this.getCollection(q.start, q.limit);
				this.nats.publish(replyTo, JSON.stringify({ result: { collection }}));
			}
		} catch (ex) {
			console.error("Error getting collection: ", ex.message);
			this.nats.publish(replyTo, ERR_NOT_FOUND);
			return;
		}
	}

	_parseQuery(query) {
		if (!query) {
			return {};
		}

		let q = query
			? url.parse('?' + query, true).query
			: {};

		q.start = q.start ? parseInt(q.start, 10) : 0;
		q.limit = q.limit ? parseInt(q.limit, 10) : 0;

		if (Number.isNaN(q.start) || Number.isNaN(q.limit)) {
			return null;
		}

		return q;
	}

	_handleGetModel(request, replyTo, subject) {
		let model = this.getModel(subject.substr(4));
		let reply = model
			? JSON.stringify({ result: { model }})
			: ERR_NOT_FOUND;
		this.nats.publish(replyTo, reply);
	}
}

module.exports = QueryCollection;
