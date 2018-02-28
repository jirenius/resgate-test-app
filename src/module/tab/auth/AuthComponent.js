import Transition from 'component/Transition';
import ModelTxt from 'modapp-resource-component/ModelTxt';
import Txt from 'modapp-base-component/Txt';
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
		this.transition = new Transition();
		this._setTransition();
		this.user.on('change', this._onUserChange);

		return this.transition.render(el);
	}

	unrender() {
		this.user.on('change', this._onUserChange);
		this.transition.unrender();
		this.transition = null;
	}

	_onUserChange(changed) {
		if (this.transition && changed.hasOwnProperty('isLoggedIn')) {
			this._setTransition();
		}
	}

	_setTransition() {
		if (this.user.isLoggedIn) {
			this.transition.fade(new Elem(n =>
				n.elem('div', { className: 'module-auth' }, [
					n.component(new ModelTxt(this.user, m => l10n.l('auth.currentlyLoggedIn', `You are currently logged in as {name}.`, m), { tagName: 'p' })),
					n.component(new Button(l10n.l('auth.logout', `Logout`), this._clickLogout)),
					n.component(new Button(l10n.l('auth.logoutGuests', `Logout guests`), this._clickLogoutGuests))
				])
			));
		} else {
			this.transition.fade(new Elem(n =>
				n.elem('div', { className: 'module-auth' }, [
					n.component(new Txt(l10n.l('auth.typeYourCredentials', `Type in your credentials and click the log in button. Available users are:`), { tagName: 'p' })),
					n.elem('ul', [
						n.component(new Txt(l10n.l('auth.guestUser', `guest/guest`), { tagName: 'li' })),
						n.component(new Txt(l10n.l('auth.adminUser', `admin/admin123`), { tagName: 'li' })),
					]),
					n.component('error', new Txt('', { tagName: 'small' })),
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
