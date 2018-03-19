import Transition from 'component/Transition';
import ModelTxt from 'modapp-resource-component/ModelTxt';
import Txt from 'modapp-base-component/Txt';
import Html from 'modapp-base-component/Html';
import Elem from 'modapp-base-component/Elem';
import Input from 'component/Input';
import Button from 'modapp-base-component/Button';
import l10n from 'modapp-l10n';
import './AuthComponent.css';

class AuthComponent {

	constructor(authModule) {
		this.authModule = authModule;
		this.user = this.authModule.getUser();

		this.transition = null;
		this.username = '';
		this.password = '';

		// Bind callbacks
		this._clickLogin = this._clickLogin.bind(this);
		this._clickLogout = this._clickLogout.bind(this);
		this._clickLogoutGuests = this._clickLogoutGuests.bind(this);
		this._onUserChange = this._onUserChange.bind(this);
	}

	render(el) {
		this.elem = new Elem(n =>
			n.elem('div', { className: 'module-auth' }, [
				n.component(new Html(l10n.l('auth.description',
					`<p>Type in your credentials and click the <em>Login</em> button. Available users are:</p>
					<ul>
						<li>guest/guest</li>
						<li>admin/admin123</li>
					</ul>
					<p>Guests have access to non-public resources and methods, while Admins have additional access to methods which may affect access priviledges.</p>
					<p>Logging in will set an authorization token on the <em>resgate</em>, and at the same time update a connection specific resource, <code>authService.user.{cid}</code>, to notify the client.
					Logging out, or being forcefully logged out, will clear the authorization token and update the resource to notify the client of the new status.
					In addition, the auth service will create a session ID (<em>sid</em>) which is used to identify the client across disconnects and reconnects.This is done by having the auth service generate and send a refresh token in the login response.
					This refresh token is bound to the session, and is used for relogin in case of a lost connection. The refresh token has a 2 minute expire time (short for testing purposes), and must be renewed before it expires,
					or else the session will be disposed and the client logged out. The client application is set to renew the session every minute.
					While session ID's and refresh tokens are not technically a part of the RES protocol, the pattern is useful to keep the user sessions alive.</p>
					<p>Used for testing auth calls, setting authorization tokens through token events (login/logout/forced logout), the concept of sessions and refresh tokens, and connection specific resource using the <em>{cid}</em> placeholders.</p>`
				), { tagName: 'div' })),
				n.elem('hr'),
				n.component('transition', new Transition())
			])
		);

		this._setTransition();
		this.user.on('change', this._onUserChange);

		return this.elem.render(el);
	}

	unrender() {
		this.user.on('change', this._onUserChange);
		this.elem.unrender();
		this.elem = null;
	}

	_onUserChange(changed) {
		if (this.elem && changed.hasOwnProperty('isLoggedIn')) {
			this._setTransition();
		}
	}

	_setTransition() {
		if (!this.elem) {
			return;
		}

		let transition = this.elem.getNode('transition');
		if (this.user.isLoggedIn) {
			transition.fade(new Elem(n =>
				n.elem('div', { className: 'module-auth' }, [
					n.component(new ModelTxt(this.user, m => l10n.l('auth.currentlyLoggedIn', `You are currently logged in as {name}.`, m), { tagName: 'p' })),
					n.component(new Button(l10n.l('auth.logout', `Logout`), this._clickLogout)),
					n.component(new Button(l10n.l('auth.logoutGuests', `Logout guests`), this._clickLogoutGuests))
				])
			));
		} else {
			transition.fade(new Elem(n =>
				n.elem('div', { className: 'module-auth' }, [
					n.component('error', new Txt('', { tagName: 'small', className: 'module-auth--error' })),
					n.component(new Input({
						value: this.username,
						onChange: value => this.username = value,
						placeholder: l10n.l('auth.username', `Username`)
					})),
					n.component(new Input({
						type: 'password',
						value: this.password,
						onChange: value => this.password = value,
						placeholder: l10n.l('auth.password', `Password`)
					})),
					n.component(new Button(l10n.l('auth.login', `Login`), this._clickLogin))
				])
			));
		}
	}

	_clickLogin() {
		this.authModule.login(this.username, this.password)
			.then(result => {
				this.password = '';
			})
			.catch(err => {
				if (!this.transition) {
					return;
				}

				this.transition.getComponent().getNode('error')
					.setText(l10n.l(err.code, err.message, err.data))
					.setClassName('show');
			});
	}

	_clickLogout() {
		this.authModule.logout();
	}

	_clickLogoutGuests() {
		this.authModule.logoutGuests().then(result => {
			alert("Done!");
		}).catch(err => alert(err.message));
	}
}

export default AuthComponent;
