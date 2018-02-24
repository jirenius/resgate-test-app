import Elem from 'modapp-base-component/Elem';
import Txt from 'modapp-base-component/Txt';
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
			name: l10n.l('module.static.static', `Static`),
			sortOrder: 10,
			componentFactory: () => new Elem(n =>
				n.elem('div', { className: 'module-static--tab' }, [
					n.component(new Txt(l10n.l('module.static.info', `Information`), { tagName: 'h3' })),
					n.component(new Txt(l10n.l('module.static.infodesc', `This tab only contains static text`), { tagName: 'p' }))
				])
			)
		});
	}

	dispose() {
		this.module.layout.removeTab('static');
	}
}

export default Static;
