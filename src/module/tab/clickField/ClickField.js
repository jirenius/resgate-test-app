import ClickFieldComponent from './ClickFieldComponent';
import l10n from 'modapp-l10n';

/**
 * ClickField adds the click field tab to the layout module
 */
class ClickField {

	constructor(app, params) {
		this.app = app;

		this.app.require([ 'layout', 'api' ], this._init.bind(this));
	}

	_init(module) {
		this.module = module;

		this.module.layout.addTab({
			id: 'clickField',
			name: l10n.l('module.clickField.clickField', `Click field`),
			sortOrder: 40,
			componentFactory: () => this.module.api.getResource('clickService.clickField')
				.then(model => new ClickFieldComponent(model))
		});
	}

	dispose() {
		this.module.layout.removeTab('clickField');
	}
}

export default ClickField;
