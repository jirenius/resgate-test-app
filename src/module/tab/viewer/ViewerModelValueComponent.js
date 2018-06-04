import Elem from 'modapp-base-component/Elem';
import Txt from 'modapp-base-component/Txt';
import ViewerResourceComponent from './ViewerResourceComponent';
import Transition from 'modapp-base-component/Transition';

class ModelValueComponent {

	constructor(prop, model, path) {
		this.prop = prop;
		this.model = model;
		this.path = path;

		// Bind callbacks
		this._onModelChange = this._onModelChange.bind(this);

		this.elem = null;
	}

	render(el) {
		this.elem = new Elem(n =>
			n.elem('div', { className: 'module-viewer--model-value' }, [
				n.component(new Txt(this.prop)),
				n.component('value', new Transition())
			])
		);

		this._setValue();
		this._setEventListener(true);

		return this.elem.render(el);
	}

	unrender() {
		this._setEventListener(false);
		this.elem.unrender();
		this.elem = null;
	}

	_setEventListener(on) {
		if (on) {
			this.model.on('change', this._onModelChange);
		} else {
			this.model.off('change', this._onModelChange);
		}
	}

	_onModelChange(changed) {
		if (!changed.hasOwnProperty(this.prop)) {
			return;
		}

		this._setValue();
	}

	_setValue() {
		if (!this.elem) {
			return;
		}

		let v = this.model[this.prop];
		let c;
		if (typeof v === 'object' && v !== null) {
			c = new ViewerResourceComponent(v, this.path);
		} else {
			let typ = v === null ? 'null' : typeof v;
			c = new Txt(String(v), { className: 'module-viewer--' + typ });
		}

		this.elem.getNode('value').fade(c);
	}
}

export default ModelValueComponent;
