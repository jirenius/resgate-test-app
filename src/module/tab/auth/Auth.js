import AuthComponent from './AuthComponent';
import l10n from 'modapp-l10n';

/**
 * Auth adds the click field tab to the layout module
 * @module module/Auth
 */
class Auth {

	constructor(app, params) {
		this.app = app;

		// Bind callbacks
		this._onConnect = this._onConnect.bind(this);

		this.app.require([ 'layout', 'api' ], this._init.bind(this));
	}

	_init(module) {
		this.module = module;
		this.user = null;

		this.module.api.setOnConnect(this._onConnect);

		this.module.layout.addTab({
			id: 'auth',
			name: l10n.l('module.auth.auth', `Authentication`),
			sortOrder: 50,
			componentFactory: () => new AuthComponent(this)
		});
	}

	isLoggedIn() {
		return !!this.user;
	}

	getUser() {
		return this.user;
	}

	login(username, password) {
		return this.module.api.authenticate('authService', 'login', { username, password })
			.then(user => {
				this.user = user;
				return user;
			})
			.catch(err => {
				this.user = null;
				throw err;
			});
	}

	logout() {
		return this.module.api.authenticate('authService', 'logout')
			.then(() => {
				this.user = null;
			});
	}

	logoutGuests() {
		return this.module.api.callModel('authService', 'logoutGuests');
	}

	_onConnect() {
		if (!this.user) {
			return;
		}

		console.log("[Auth] Trying to reconnect");

		// Try to relogin if we have a user (tokenKey)
		return this.module.api.authenticate('authService', 'relogin', { tokenKey: this.user.tokenKey })
			.then(user => {
				console.log("[Auth] Successfully reconnected");
				this.user = user;
			})
			.catch(err => {
				console.log("[Auth] Error reconnecting: ", err);
				this.user = null;
			});
	}

	dispose() {
		this.module.layout.removeTab('auth');
	}
}

export default Auth;
