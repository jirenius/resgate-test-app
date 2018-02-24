
/**
 * EventLogger module logs all emitted events onto the console
 */
class EventLogger {

	constructor(app, params) {
		this.app = app;

		// Bind callbacks
		this._handleEvent = this._handleEvent.bind(this);

		this._init();
	}

	_init() {
		this.app.eventBus.on(null, null, this._handleEvent);
	}

	_handleEvent(data, target, event) {
		console.info("[EventLogger] ", event, data === undefined ? "" : data);
	}
}

export default EventLogger;
