import ResClient from 'resclient';
import { obj } from 'modapp-utils';

const namespace = 'module.api';

/**
 * Api module connects to the backend api and provides low level
 * methods for service modules to send and receive data.
 */
class Api extends ResClient {

	constructor(app, params) {
		let opt = obj.copy(params, {
			hostUrl: {
				type: 'string',
				default: `/ws`
			},
			webResourcePath: {
				type: 'string',
				default: `/api/`
			}
		});
		super(opt.hostUrl, { namespace, eventBus: app.eventBus });

		this.app = app;
		this.webResourcePath = this._resolveWebResourcePath(opt.webResourcePath);
	}

	getWebResourceUri(rid) {
		let idx = rid.indexOf('?');
		let rname = idx >= 0 ? rid.substr(0, idx) : rid;
		let query = idx >= 0 ? rid.substr(idx) : '';

		return this.webResourcePath + rname.replace(/\./g, '/') + query;
	}

	_resolveWebResourcePath(url) {
		if (!url.match(/^http?:\/\//)) {
			let a = document.createElement('a');
			a.href = url;
			url = a.href;
		}

		return url.replace(/\/$/, '') + '/';
	}
}

export default Api;
