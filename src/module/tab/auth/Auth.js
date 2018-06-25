import { Model } from 'modapp-resource';
import l10n from 'modapp-l10n';
import AuthComponent from './AuthComponent';

const EXPIRE_DURATION = 2 * 60 * 1000; // Token expires after 2 min. Should be renewed after half.

/**
 * Auth adds the click field tab to the layout module
 * @module module/Auth
 */
class Auth {

	constructor(app, params) {
		this.app = app;

		// Bind callbacks
		this._onConnect = this._onConnect.bind(this);
		this._onUserChange = this._onUserChange.bind(this);

		this.app.require([ 'layout', 'api' ], this._init.bind(this));
	}

	_init(module) {
		this.module = module;

		this.apiUser = null;
		this.tokenKey = null;
		// Create a ordinary Model that is kept in sync with the api user.
		// This is to avoid having a promise to the user.
		this.user = new Model({
			namespace: 'auth.user',
			definition: {
				id: { type: '?number' },
				name: { type: '?string' },
				role: { type: '?string' },
				isLoggedIn: { type: 'boolean' }
			}
		});

		this.module.api.setOnConnect(this._onConnect);

		this.module.layout.addTab({
			id: 'auth',
			name: l10n.l('auth.auth', `Authentication`),
			sortOrder: 70,
			componentFactory: () => new AuthComponent(this)
		});
	}

	getUser() {
		return this.user;
	}

	login(username, password) {
		if (!this.apiUser) {
			return this.module.api.get('authService.user.{cid}').then(apiUser => {
				this.apiUser = apiUser;
				this.apiUser.on('change', this._onUserChange);

				return this._authenticate(username, password);
			});
		}

		return this._authenticate(username, password);
	}

	_authenticate(username, password) {
		return this.module.api.authenticate('authService', 'login', { username, password })
			.then(result => {
				console.log("[Auth] Successfully connected");
				this._setTokenKey(result.tokenKey);
			})
			.catch(err => {
				console.log("[Auth] Error connecting: ", err);
				this._setTokenKey(null);
			});
	}

	logout() {
		return this.module.api.authenticate('authService', 'logout');
	}

	logoutGuests() {
		return this.module.api.call('authService', 'logoutGuests');
	}

	_onUserChange() {
		this.user.set({
			id: this.apiUser.id,
			name: this.apiUser.name,
			role: this.apiUser.role,
			isLoggedIn: !!this.apiUser.id
		});
	}

	_onConnect() {
		if (!this.tokenKey) {
			return;
		}

		console.log("[Auth] Trying to reconnect");

		// Try to relogin if we have a user (tokenKey)
		return this.module.api.authenticate('authService', 'relogin', { tokenKey: this.tokenKey })
			.then(result => {
				console.log("[Auth] Successfully reconnected");
				this._setTokenKey(result.tokenKey);
			})
			.catch(err => {
				console.log("[Auth] Error reconnecting: ", err);
				this._setTokenKey(null);
			});
	}

	_setTokenKey(tokenKey) {
		this._clearTimeout();

		this.tokenKey = tokenKey;
		if (tokenKey) {
			this.timeoutId = setTimeout(this._onConnect, EXPIRE_DURATION / 2);
		}
	}

	_clearTimeout() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}

	dispose() {
		if (this.apiUser) {
			this.apiUser.off('change', this._onUserChange);
		}
		this._clearTimeout();
		this.module.api.setOnConnect(null);
		this.module.layout.removeTab('auth');
	}
}

export default Auth;
