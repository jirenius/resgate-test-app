import l10n from 'modapp-l10n';
import FormComponent from './FormComponent';

/**
 * Form adds the form tab to the layout module
 * @module module/Form
 */
class Form {

	constructor(app, params) {
		this.app = app;

		this.app.require([ 'layout', 'api', 'auth' ], this._init.bind(this));
	}

	_init(module) {
		this.module = module;

		this.module.layout.addTab({
			id: 'form',
			name: l10n.l('form.form', `Form`),
			sortOrder: 20,
			componentFactory: () => this.module.api.getResource('formService.form').then(model => new FormComponent(this.module, model))
		});
	}

	dispose() {
		this.module.layout.removeTab('form');
	}
}

export default Form;
