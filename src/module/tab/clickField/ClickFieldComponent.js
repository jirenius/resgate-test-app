import Txt from 'modapp-base-component/Txt';
import Elem from 'modapp-base-component/Elem';
import ModelTxt from 'modapp-resource-component/ModelTxt';
import l10n from 'modapp-l10n';
import './ClickFieldComponent.css';

class ClickFieldComponent {

	constructor(clickField) {
		this.clickField = clickField;

		// Bind callbacks
		this._onMouseClick = this._onMouseClick.bind(this);
		this._onFieldClick = this._onFieldClick.bind(this);

		this.elem = null;
	}

	render(el) {
		this.elem = new Elem(n =>
			n.elem('div', { className: 'module-clickField' }, [
				n.component(new Txt(l10n.l('module.clickField.clickFielddesc', `See where others click. And if you are logged in, click anywhere to send an event yourself.`), { tagName: 'p' })),
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
