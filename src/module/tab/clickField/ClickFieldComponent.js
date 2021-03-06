import { Elem, Html } from 'modapp-base-component';
import { ModelTxt } from 'modapp-resource-component';
import l10n from 'modapp-l10n';
import './ClickFieldComponent.css';

class ClickFieldComponent {

	constructor(clickField, module) {
		this.clickField = clickField;
		this.module = module;

		// Bind callbacks
		this._onMouseClick = this._onMouseClick.bind(this);
		this._onFieldClick = this._onFieldClick.bind(this);

		this.elem = null;
	}

	render(el) {
		this.elem = new Elem(n =>
			n.elem('div', { className: 'module-clickField' }, [
				n.component(new Html(l10n.l('clickField.desc', `<p>See where others click. And if you are logged in, click anywhere to send an event yourself. If you are not logged in, a click should result in an <em>Access denied</em> error in the console.</p><p>Used for testing custom events, call access, and <em>system.reset</em> on the counter.</p>`))),
				n.elem('div', [
					n.text('Web resource: '),
					n.elem('a', { attributes: {
						href: this.module.api.getWebResourceUri('clickService.clickField'),
						target: '_blank'
					}}, [
						n.text(this.module.api.getWebResourceUri('clickService.clickField'))
					])
				]),
				n.elem('hr'),
				n.elem('span', [
					n.text('Click count: '),
					n.component(new ModelTxt(this.clickField, m => String(m.clickCount)))
				]),
			])
		);

		this._setEventListeners(true);
		return this.elem.render(el);
	}

	unrender() {
		this._setEventListeners(false);
		this.elem.unrender();
		this.elem = null;
	}

	_setEventListeners(on) {
		if (on) {
			document.addEventListener('click', this._onMouseClick);
			this.clickField.on('click', this._onFieldClick);
		} else {
			document.removeEventListener('click', this._onMouseClick);
			this.clickField.off('click', this._onFieldClick);
		}
	}

	_onMouseClick(e) {
		this.clickField.call('click', { xpos: e.clientX, ypos: e.clientY });
	}

	_onFieldClick(e) {
		let el = document.createElement('div');
		el.className = 'module-clickField--blip';

		el.style.left = e.xpos + 'px';
		el.style.top = e.ypos + 'px';

		document.body.appendChild(el);
		el.classList.add('ripple');

		setTimeout(() => {
			if (el && el.parentNode) {
				el.parentNode.removeChild(el);
			}
		}, 2000);
	}
}

export default ClickFieldComponent;
