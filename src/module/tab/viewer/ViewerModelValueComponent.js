import { Elem, Transition, Txt } from 'modapp-base-component';
import ViewerResourceComponent from './ViewerResourceComponent';

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
			n.elem('div', { className: 'module-viewer--value' }, [
				n.elem('div', { className: 'head' }, [
					n.component(new Txt(this.prop)),
					n.component('head', new Transition())
				]),
				n.elem('div', { className: 'body' }, [
					n.component('body', new Transition())
				])
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
		let h, b = null;
		if (typeof v === 'object' && v !== null) {
			h = null;
			b = new ViewerResourceComponent(v, this.path);
		} else {
			let typ = v === null ? 'null' : typeof v;
			h = new Txt(String(v), { className: 'module-viewer--' + typ });
			b = null;
		}

		this.elem.getNode('head').fade(h);
		this.elem.getNode('body').fade(b);
	}
}

export default ModelValueComponent;
