import { elem, obj } from 'modapp-utils';
import l10n from 'modapp-l10n';

/**
 * An input component
 */
class Input {

	/**
	 * Creates an Input instance
	 * @param {object} [opt] Optional parameters.
	 * @param {string} [opt.value] Default value. Defaults to empty string.
	 * @param {string|LocaleString} [opt.placeholder] Placeholder text
	 * @param {string} [opt.className] Class name.
	 * @param {function} [opt.type] Input type.
	 * @param {object} [opt.attributes] Attributes key/value object.
	 * @param {function} [opt.onChange] Callback on change.
	 * @param {function} [opt.onEnter] Callback on enter.
	 */
	constructor(opt) {
		obj.update(this, opt, {
			disabled: {
				type: 'boolean'
			},
			className: {
				type: '?string'
			},
			type: {
				type: 'string',
				default: 'text'
			},
			attributes: {
				type: '?object'
			},
			onChange: {
				type: '?function'
			},
			onEnter: {
				type: '?function'
			},
			placeholder: {
				type: 'any'
			},
			tagName: {
				type: 'string',
				default: 'input'
			},
			limit: {
				type: '?number'
			}
		});

		this.input = null;
		this.value = opt.value || "";

		// Bind callbacks
		this._onChange = this._onChange.bind(this);
		this._onKeypress = this._onKeypress.bind(this);
		this._setPlaceholder = this._setPlaceholder.bind(this);
	}

	setDisabled(disabled) {
		this.disabled = disabled;

		if (!this.input) {
			return;
		}

		if (disabled) {
			this.input.setAttribute('disabled', 'disabled');
		} else {
			this.input.removeAttribute('disabled');
		}
	}

	setPlaceholder(placeholder) {
		placeholder = placeholder || null;
		if (this.placeholder === placeholder) {
			return;
		}

		this.placeholder = placeholder;
		if (this.input) {
			this._setPlaceholder();
		}
	}

	setFocus() {
		if (this.input) {
			this.input.focus();
		}
	}

	/**
	 * Sets the input value
	 * @param {string} value Input value
	 */
	setValue(value) {
		value = value || "";
		if (value === this.value) {
			return;
		}

		if (this.limit) {
			if (value.length > this.limit) {
				value = value.substring(0, this.limit);
			}
		}

		this.value = value;
		this._updateInput();

		if (this.onChange) {
			this.onChange(this.value);
		}
	}

	getValue() {
		// Ensuring the value is up to date
		if (this.input) {
			this.setValue(this.input.value);
		}
		return this.value;
	}

	render(el) {
		this.input = elem.create(this.tagName, {
			className: 'comp-input' + (this.className ? ' ' + this.className : ''),
			attributes: this.attributes
		});

		this.input.value = this.value;
		this.setDisabled(this.disabled);

		this._setPlaceholder();

		if (this.type) {
			this.input.setAttribute("type", this.type);
		}

		this._setEventListener(true);

		return elem.append(el, this.input);
	}

	unrender() {
		if (!this.input) {
			return;
		}

		this._setEventListener(false);

		// Ensuring the value is up to date
		this.setValue(this.input.value);

		elem.remove(this.input);
		this.input = null;
	}

	_onChange(event) {
		this.setValue(this.input.value);
	}

	_onKeypress(event) {
		if (event.keyCode == 13) {
			event.preventDefault();
			this.onEnter();
		}
	}

	_updateInput() {
		if (!this.input) {
			return;
		}

		this.input.value = this.value;
	}

	_setPlaceholder() {
		if (this.placeholder) {
			this.input.setAttribute('placeholder', l10n.t(this.placeholder));
		} else {
			this.input.removeAttribute('placeholder');
		}
	}

	_setEventListener(on) {
		if (on) {
			l10n.on('localeUpdate', this._setPlaceholder);
			this.input.addEventListener("change", this._onChange);
			this.input.addEventListener("input", this._onChange);

			if (this.onEnter) {
				this.input.addEventListener("keypress", this._onKeypress);
			}
		} else {
			l10n.off('localeUpdate', this._setPlaceholder);
			this.input.removeEventListener("change", this._onChange);
			this.input.removeEventListener("input", this._onChange);

			if (this.onEnter) {
				this.input.removeEventListener('keypress', this._onKeypress);
			}
		}
	}
}

export default Input;
