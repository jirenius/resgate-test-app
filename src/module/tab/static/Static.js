import Elem from 'modapp-base-component/Elem';
import Html from 'modapp-base-component/Html';
import l10n from 'modapp-l10n';

/**
 * Static adds a static content tab to the layout module
 * @module module/Static
 */
class Static {

	constructor(app, params) {
		this.app = app;

		this.app.require([ 'layout' ], this._init.bind(this));
	}

	_init(module) {
		this.module = module;

		this.module.layout.addTab({
			id: 'static',
			name: l10n.l('static.static', `Static`),
			sortOrder: 10,
			componentFactory: () => new Elem(n =>
				n.elem('div', { className: 'module-static--tab' }, [
					n.component(new Html(l10n.l('static.description', `<p>This tab only contains static text.</p><p>Since this tab doesn't listen to any resources, it can be used to see how the client unsubscribes to resources previously listened to in other tabs.</p>`), { tagName: 'div' })),
					n.elem('hr')
				])
			)
		});
	}

	dispose() {
		this.module.layout.removeTab('static');
	}
}

export default Static;
