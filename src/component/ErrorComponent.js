import { Elem, Txt } from 'modapp-base-component';
import l10n from 'modapp-l10n';

/**
 * ErrorComponent displays an error message.
 */
class ErrorComponent {

	/**
	 * Creates a new ErrorComponent instance
	 * @param {string|object} error Error message or object with message property
	 * @param {object} [opt] Optional parameters. See RootElem.
	 */
	constructor(error) {
		this.error = error;
		this.elem = null;
	}

	render(el) {
		this.elem = new Elem(n => n.elem('div', { className: 'comp-error' }, [
			n.component(new Txt(l10n.l('comp.error.anErrorOccurred', `An error occurred`), { tagName: 'h3' })),
			n.component(new Txt(this._getMessage()), { tagName: 'p' })
		]));
		return this.elem.render(el);
	}

	unrender() {
		this.elem.unrender();
	}

	_getMessage() {
		let msg = this.error;
		let typ = typeof msg;
		if (typ !== 'string') {
			if (msg && typ === 'object') {
				msg = msg.message;
			}

			if (typeof msg !== 'string') {
				msg = l10n.l(`Unknown error`);
			}
		}

		return msg;
	}
}

export default ErrorComponent;
