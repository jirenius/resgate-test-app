import Txt from 'modapp-base-component/Txt';
import Html from 'modapp-base-component/Html';
import Elem from 'modapp-base-component/Elem';
import Input from 'component/Input';
import Button from 'modapp-base-component/Button';
import Checkbox from 'modapp-base-component/Checkbox';
import ModelComponent from 'modapp-resource-component/ModelComponent';
import ModifyModel from 'modapp-resource/ModifyModel';
import l10n from 'modapp-l10n';
import './FormComponent.css';

class FormComponent {

	constructor(module, model) {
		this.module = module;
		this.model = model;

		this.modifyModel = null;
		this.elem = null;

		// Bind callbacks
		this._clickSubmit = this._clickSubmit.bind(this);
	}

	render(el) {
		this.modifyModel = new ModifyModel(this.model);

		this.elem = new Elem(n =>
			n.elem('div', { className: 'module-form' }, [
				n.component(new Html(l10n.l('form.editInstruction', `<p>Edit the form as you see fit, and click submit to update the remote service model with your local modifications.</p><p>All modifications are stored in a wrapper model, <em>ModifyModel</em>, which keeps track of any differences between the service model and any local edits. If the remote model is changed by another client, these changes will show directly unless you've started to edit the same field. You can only click <em>Submit</em> when there are modifications to submit.</p><p>Used for testing calling the <em>set</em> method, and the usage of <em>ModifyModel</em> for simultaneous editing.</p>`), { tagName: 'p' })),
				n.elem('div', [
					n.text('Web resource: '),
					n.elem('a', { attributes: {
						href: this.module.api.getWebResourceUri('formService.form'),
						target: '_blank'
					}}, [
						n.text(this.module.api.getWebResourceUri('formService.form'))
					])
				]),
				n.elem('hr'),
				n.component('error', new Txt('', { tagName: 'small', className: 'module-form--error' })),
				n.component(new ModelComponent(
					this.modifyModel,
					new Input({
						value: this.modifyModel.input,
						onChange: value => this.modifyModel.set({ input: value }),
						placeholder: l10n.l('form.typeSomething', `Type something`)
					}),
					(m, c) => {
						c.setValue(m.input);
					}
				)),
				n.elem('label', [
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
					n.component(new Txt(l10n.l('form.checkMe', "Check me"), { tagName: 'small' }))
				]),
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

		this.modifyModel.dispose();
		this.modifyModel = null;
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
