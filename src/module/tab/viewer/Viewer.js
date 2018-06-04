import l10n from 'modapp-l10n';
import ViewerComponent from './ViewerComponent';
import Model from 'modapp-resource/Model';

/**
 * Viewer adds the viewer tab to the layout module
 */
class Viewer {

	constructor(app, params) {
		this.app = app;

		this.app.require([ 'layout', 'api' ], this._init.bind(this));
	}

	_init(module) {
		this.module = module;

		this.model = new Model({
			data: {
				rid: 'complexService.collection'
			}
		});

		this.module.layout.addTab({
			id: 'viewer',
			name: l10n.l('viewer.viewer', `Viewer`),
			sortOrder: 60,
			componentFactory: () => new ViewerComponent(this.module, this.model)
		});
	}

	dispose() {
		this.module.layout.removeTab('viewer');
	}
}

export default Viewer;
