import ModelTxt from 'modapp-resource-component/ModelTxt';
import Txt from 'modapp-base-component/Txt';
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
			componentFactory: () => this.module.api.getResource('tickerService.ticker').then(model => new Elem(n =>
				n.elem('div', { className: 'model-ticker' }, [
					n.component(new Txt(l10n.l('ticker.ticker', `Ticker`), { tagName: 'h3' })),
					n.component(new Txt(l10n.l('ticker.tickerdesc', `Below counter is pushed by model change events from the ticker service.`), { tagName: 'p' })),
					n.elem('span', [
						n.text('Count: '),
						n.component(new ModelTxt(model, m => String(m.count)))
					]),
					n.component(new ModelTxt(model,
						m => m.accessible
							? `Public`
							: `Private`
						, { tagName: 'div' }
					)),
					n.component(this.module.auth.getUser() && this.module.auth.getUser().role === 'admin'
						? new Button(l10n.l('ticker.toggleTickerAccess', `Toggle ticker access`), () => this._toggleTickerAccess(model))
						: null
					)
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
