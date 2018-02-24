import Transition from 'component/Transition';
import Txt from 'modapp-base-component/Txt';
import Elem from 'modapp-base-component/Elem';
import Input from 'component/Input';
import Button from 'modapp-base-component/Button';
import l10n from 'modapp-l10n';
import './AuthComponent.css';

class AuthComponent {

	constructor(authModule) {
		this.authModule = authModule;

		this.transition = null;
		this.username = '';
		this.password = '';

		// Bind callbacks
		this._clickLogin = this._clickLogin.bind(this);
		this._clickLogout = this._clickLogout.bind(this);
		this._clickLogoutGuests = this._clickLogoutGuests.bind(this);
	}

	render(el) {
		this.transition = new Transition();
		this._setTransition();

		return this.transition.render(el);
	}

	unrender() {
		this.transition.unrender();
		this.transition = null;
	}

	_setTransition() {
		if (this.authModule.isLoggedIn()) {
			this.transition.fade(new Elem(n =>
				n.elem('div', { className: 'module-auth' }, [
					n.component(new Txt(l10n.l('module.auth.currentlyLoggedIn', `You are currently logged in.`), { tagName: 'p' })),
					n.component(new Button(l10n.l('module.auth.logout', `Logout`), this._clickLogout)),
					n.component(new Button(l10n.l('module.auth.logoutGuests', `Logout guests`), this._clickLogoutGuests))
				])
			));
		} else {
			this.transition.fade(new Elem(n =>
				n.elem('div', { className: 'module-auth' }, [
					n.component(new Txt(l10n.l('module.auth.typeYourCredentials', `Type in your credentials and click the log in button. Available users are:`), { tagName: 'p' })),
					n.elem('ul', [
						n.component(new Txt(l10n.l('module.auth.guestUser', `guest/guest`), { tagName: 'li' })),
						n.component(new Txt(l10n.l('module.auth.adminUser', `admin/admin123`), { tagName: 'li' })),
					]),
					n.component('error', new Txt('', { tagName: 'small' })),
					n.component(new Input({
						value: this.username,
						onChange: value => this.username = value,
						placeholder: l10n.l('module.auth.username', `Username`)
					})),
					n.component(new Input({
						type: 'password',
						value: this.password,
						onChange: value => this.password = value,
						placeholder: l10n.l('module.auth.password', `Password`)
					})),
					n.component(new Button(l10n.l('module.auth.login', `Login`), this._clickLogin))
				])
			));
		}
	}

	_clickLogin() {
		this.authModule.login(this.username, this.password)
			.then(result => {
				this._setTransition();
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
		this.authModule.logout().then(result => {
			this._setTransition();
			this.password = '';
		});
	}

	_clickLogoutGuests() {
		this.authModule.logoutGuests().then(result => {
			alert("Done!");
		}).catch(err => alert(err.message));
	}
}

export default AuthComponent;
