import { Button, Elem, Html, Txt } from 'modapp-base-component';
import { ModelComponent, CollectionList } from 'modapp-resource-component';
import { Collection, Model } from 'modapp-resource';
import l10n from 'modapp-l10n';
import Input from 'component/Input';
import DynamicPropertyComponent from './DynamicPropertyComponent';
import './DynamicComponent.css';

class DynamicComponent {

	constructor(module, model) {
		this.module = module;
		this.model = model;

		// Bind callbacks
		this._handleModelChange = this._handleModelChange.bind(this);

		this.elem = null;
	}

	render(el) {
		let propertyModel = new Model({ data: { name: "" }});
		let collection = this._createCollection();

		this.elem = new Elem(n =>
			n.elem('div', { className: 'module-dynamic' }, [
				n.component(new Html(l10n.l('dynamic.editInstruction', `<p>Add, edit, or delete the fields of the dynamic model.</p><p>All properties and values are stored in one single model</p><p>Used for testing creation and deletion of model properties.</p>`), { tagName: 'div' })),
				n.elem('div', [
					n.text('Web resource: '),
					n.elem('a', { attributes: {
						href: this.module.api.getWebResourceUri('dynamicService.model'),
						target: '_blank'
					}}, [
						n.text(this.module.api.getWebResourceUri('dynamicService.model'))
					])
				]),
				n.elem('hr'),
				n.component('error', new Txt('', { tagName: 'small', className: 'module-dynamic--error' })),
				n.elem('div', { className: 'module-dynamic--create' }, [
					n.component(new ModelComponent(
						propertyModel,
						new Input({
							value: propertyModel.name,
							onChange: value => propertyModel.set({ name: value }),
							placeholder: l10n.l('dynamic.newPropertyName', `New property name`)
						}),
						(m, c) => {
							c.setValue(m.name);
						}
					)),
					n.component(new ModelComponent(
						propertyModel,
						new Button(l10n.l('dynamic.create', `Create`), () => this._clickCreate(propertyModel)),
						(m, c) => c.setDisabled(!m.name || this.model.hasOwnProperty(m.name) || this.model[m.name])
					)),
				]),
				n.elem('hr'),
				n.component(new CollectionList(collection, m => new DynamicPropertyComponent(m.id, this.model)))
			])
		);

		return this.elem.render(el);
	}

	unrender() {
		this.elem.unrender();
		this.elem = null;
		this._disposeCollection();
	}

	_createCollection() {
		let data = [];
		Object.keys(this.model).forEach(id => {
			if (this.model.hasOwnProperty(id) && id.substr(0, 1) !== '_') {
				data.push({ id });
			}
		});

		this.collection = new Collection({
			data,
			compare: (a, b) => a.id.localeCompare(b.id)
		});
		this.model.on('change', this._handleModelChange);

		return this.collection;
	}

	_disposeCollection() {
		this.model.off('change', this._handleModelChange);
		this.collection = null;
	}

	_handleModelChange(change) {
		console.log("CHANGE: ", change);
		for (let id in change) {
			if (change[id] === undefined) {
				this.collection.add({ id });
			} else if (this.model[id] === undefined) {
				this.collection.remove(id);
			}
		}
	}

	_clickCreate(propertyModel) {
		let o = {};
		o[propertyModel.name] = "";
		// Set new property to empty, and clear name field on success
		this.model.set(o).then(() => propertyModel.set({ name: '' }));
	}
}

export default DynamicComponent;
