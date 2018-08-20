import { Elem, Html } from 'modapp-base-component';
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
					n.component(new Html(l10n.l('static.description', `<p>The <a href="https://github.com/jirenius/resgate-test-app">Resgate Test App</a> is used to test and develop <a href="https://github.com/jirenius/resgate">Resgate</a>.</p><p>Each tab is used to try out different concept of the RES protocol. This tab only contains static text.</p><p>Since this tab doesn't subscribe to any resources, it can be used to see how the client unsubscribes to resources previously subscribed to in other tabs.</p>`), { tagName: 'div' })),
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
