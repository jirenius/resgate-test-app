import Elem from 'modapp-base-component/Elem';
import Input from 'component/Input';
import Button from 'modapp-base-component/Button';
import Txt from 'modapp-base-component/Txt';
import ModelComponent from 'modapp-resource-component/ModelComponent';
import l10n from 'modapp-l10n';

class DynamicPropertyComponent {

	constructor(prop, model) {
		this.prop = prop;
		this.model = model;

		this.elem = null;

		// Bind callbacks
		this._clickDelete = this._clickDelete.bind(this);
	}

	render(el) {
		this.elem = new Elem(n =>
			n.elem('div', { className: 'module-dynamic--property' }, [
				n.component(new Txt(this.prop)),
				n.component(new ModelComponent(
					this.model,
					new Input({
						value: this.model[this.prop],
						onChange: value => {
							let o = {};
							o[this.prop] = value;
							this.model.set(o);
						}
					}),
					(m, c, changed) => this.model[this.prop] !== undefined && c.setValue(this.model[this.prop])
				)),
				n.component(new Button(l10n.l('dynamic.delete', `Delete`), this._clickDelete))
			])
		);

		return this.elem.render(el);
	}

	unrender() {
		this.elem.unrender();
		this.elem = null;
	}

	_clickDelete() {
		let o = {};
		o[this.prop] = undefined;
		// Set property to undefined to delete it
		this.model.set(o);
	}
}

export default DynamicPropertyComponent;
