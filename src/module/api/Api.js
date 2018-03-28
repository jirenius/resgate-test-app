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
			},
			webResourceUrl: {
				type: 'string',
				default: `/api`
			}
		});
		super(opt.hostUrl, { namespace, eventBus: app.eventBus });

		this.app = app;
		this.webResourceUrl = this._resolvewebResourcePath(opt.webResourceUrl);
	}

	getWebResourceUri(rid) {
		let idx = rid.indexOf('?');
		let rname = idx >= 0 ? rid.substr(0, idx) : rid;
		let query = idx >= 0 ? rid.substr(idx) : '';

		return this.webResourceUrl + rname.replace(/\./g, '/') + query;
	}

	_resolvewebResourcePath(url) {
		if (!url.match(/^http?:\/\//)) {
			let a = document.createElement('a');
			a.href = url;
			url = a.href;
		}

		return url.replace(/\/$/, '') + '/';
	}
}

export default Api;
