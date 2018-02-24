import ResClient from 'resclient';
import * as obj from 'modapp-utils/obj';

const namespace = 'module.api';

/**
 * Api module connects to the backend api and provides low level
 * methods for service modules to send and recieve data.
 */
class Api extends ResClient {

	constructor(app, params) {
		let opt = obj.copy(params, {
			hostUrl: {
				type: 'string',
				default: `/ws`
			}
		});
		super(app.eventBus, opt.hostUrl, namespace);
		this.app = app;

		this._init();
	}

	_init() {}
}

export default Api;
