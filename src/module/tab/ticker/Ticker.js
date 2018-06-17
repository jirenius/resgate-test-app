import ModelTxt from 'modapp-resource-component/ModelTxt';
import ModelComponent from 'modapp-resource-component/ModelComponent';
import Transition from 'component/Transition';
import Html from 'modapp-base-component/Html';
import Elem from 'modapp-base-component/Elem';
import Button from 'modapp-base-component/Button';
import l10n from 'modapp-l10n';

/**
 * Ticker adds the ticker tab to the layout module
 */
class Ticker {

	constructor(app, params) {
		this.app = app;

		this.app.require([ 'layout', 'api', 'auth' ], this._init.bind(this));
	}

	_init(module) {
		this.module = module;

		this.module.layout.addTab({
			id: 'ticker',
			name: l10n.l('ticker.ticker', `Ticker`),
			sortOrder: 20,
			componentFactory: () => this.module.api.get('tickerService.ticker').then(model => new Elem(n =>
				n.elem('div', { className: 'model-ticker' }, [
					n.component(new Html(l10n.l('ticker.desc', `<p>Below counter is pushed by model change events from the ticker service.</p><p>Access is controlled by a toggle button only available when logged in as admin.<br>When public, anyone will get access to the model, but when private, you must be logged in as admin or guest to get access.</p><p>Used for testing model change events and access control, both on model reaccess events and token reaccess.</p>`), { tagName: 'p' })),
					n.elem('div', [
						n.text('Web resource: '),
						n.elem('a', { attributes: {
							href: this.module.api.getWebResourceUri('tickerService.ticker'),
							target: '_blank'
						}}, [
							n.text(this.module.api.getWebResourceUri('tickerService.ticker'))
						])
					]),
					n.elem('hr'),
					n.elem('div', [
						n.text('Count: '),
						n.component(new ModelTxt(model, m => String(m.count)))
					]),
					n.elem('div', [
						n.text('Access: '),
						n.component(new ModelTxt(model, m => (m.accessible
							? `Public`
							: `Private`
						)))
					]),
					// Show Toggle ticker access button for admins
					n.component(new ModelComponent(this.module.auth.getUser(), new Transition(), (m, c, change) => {
						if (change && !change.hasOwnProperty('role')) {
							return;
						}

						c.fade(m.role === 'admin'
							? new Button(l10n.l('ticker.toggleTickerAccess', `Toggle ticker access`), () => this._toggleTickerAccess(model))
							: null
						);
					}))
				])
			))
		});
	}

	_toggleTickerAccess(model) {
		model.set({ accessible: !model.accessible });
	}

	dispose() {
		this.module.layout.removeTab('ticker');
	}
}

export default Ticker;
