import Input from './Input';

/**
 * A textarea component
 */
class Textarea extends Input {

	/**
	 * Creates a Textarea instance
	 * @param {object} [opt] Optional parameters.
	 * @param {string} [opt.className] Optional class name.
	 * @param {function} [opt.type] Optional input type.
	 * @param {object} [opt.attributes] Optional attributes key/value object.
	 * @param {function} [opt.onChange] Optional callback on change.
	 * @param {function} [opt.onEnter] Optional callback on enter.
	 */
	constructor(opt) {
		super(Object.assign({}, opt, { tagName: 'textarea' }));
	}
}

export default Textarea;
