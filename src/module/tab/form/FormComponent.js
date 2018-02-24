import Txt from 'modapp-base-component/Txt';
import Elem from 'modapp-base-component/Elem';
import Input from 'component/Input';
import Button from 'modapp-base-component/Button';
import Checkbox from 'modapp-base-component/Checkbox';
import ModelComponent from 'modapp-resource-component/ModelComponent';
import ModifyModel from 'modapp-resource/ModifyModel';
import l10n from 'modapp-l10n';
import './FormComponent.css';

class FormComponent {

	constructor(app, model) {
		this.app = app;
		this.model = model;

		this.modifyModel = new ModifyModel(this.model, this.app.eventBus, 'module.form.modifyModel');
		this.elem = null;

		// Bind callbacks
		this._clickSubmit = this._clickSubmit.bind(this);
	}

	render(el) {
		this.elem = new Elem(n =>
			n.elem('div', { className: 'module-form' }, [
				n.component(new Txt(l10n.l('form.editInstruction', `Edit the form as you see fit, and click submit when ready. Other peoples submits will change the form unless you have made changes to it.`), { tagName: 'p' })),
				n.component('error', new Txt('', { tagName: 'small' })),
				n.component(new ModelComponent(
					this.modifyModel,
					new Input({
						value: this.modifyModel.input,
						onChange: value => this.modifyModel.set({ input: value }),
						placeholder: l10n.l('module.form.typeSomething', `Type something`)
					}),
					(m, c) => {
						c.setValue(m.input);
					}
				)),
				n.component(new ModelComponent(
					this.modifyModel,
					new Checkbox(this.modifyModel.checkbox, {
						events: { change: (c, ev) => {
							this.modifyModel.set({ checkbox: c.isChecked() });
						} }
					}),
					(m, c) => {
						c.setChecked(this.modifyModel.checkbox);
					}
				)),
				n.component(new ModelComponent(
					this.modifyModel,
					new Button(l10n.l('form.submit', `Submit`), this._clickSubmit),
					(m, c) => c.setDisabled(!m.isModified)
				))
			])
		);

		return this.elem.render(el);
	}

	unrender() {
		this.elem.unrender();
		this.elem = null;
	}

	_clickSubmit() {
		let mods = this.modifyModel.getModifications();

		this.model.set(mods)
			.catch(err => {
				if (!this.elem) {
					return;
				}

				this.elem.getNode('error')
					.setText(l10n.l(err.code, err.message, err.data))
					.setClassName('show');
			});
	}
}

export default FormComponent;
