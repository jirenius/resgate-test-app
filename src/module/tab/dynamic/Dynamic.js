import l10n from 'modapp-l10n';
import DynamicComponent from './DynamicComponent';

/**
 * Dynamic adds the dynamic tab to the layout module
 */
class Dynamic {

	constructor(app, params) {
		this.app = app;

		this.app.require([ 'layout', 'api' ], this._init.bind(this));
	}

	_init(module) {
		this.module = module;

		this.module.layout.addTab({
			id: 'dynamic',
			name: l10n.l('dynamic.dynamic', `Dynamic`),
			sortOrder: 50,
			componentFactory: () => this.module.api.getResource('dynamicService.model').then(model => new DynamicComponent(this.module, model))
		});
	}

	dispose() {
		this.module.layout.removeTab('dynamic');
	}
}

export default Dynamic;
