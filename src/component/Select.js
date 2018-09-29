import { elem, obj } from 'modapp-utils';
import l10n from 'modapp-l10n';

import './Select.css';

/**
 * A select component
 */
class Select {

	/**
	 * Creates a Select instance
	 * @param {Array.<object>|Collection} options Array or Collection of options
	 * @param {object} [opt] Optional parameters.
	 * @param {*} [opt.value] Optional initial value. Defaults to the value of the first option
	 * @param {string} [opt.className] Optional class name.
	 * @param {boolean} [opt.disabled] Optional disabled flag. Defaults to false.
	 * @param {object} [opt.attributes] Optional attributes key/value object.
	 * @param {function} [opt.onChange] Optional callback on change.
	 * @param {function} [opt.nameAttribute] Optional nameAttribute callback. Will receive the item and return the name string. Defaults to the item.name property.
	 * @param {function} [opt.valueAttribute] Option valueAttribute callback. Will receive the item and return the value string. Defaults to the item.value property.
	 */
	constructor(options, opt) {
		this.opt = obj.copy(opt, {
			className: { type: '?string' },
			optionClassName: { type: 'function', default: o => o.className },
			disabled: { type: 'boolean' },
			attributes: { type: '?object' },
			onChange: { type: '?function' },
			nameAttribute: { type: 'function', default: o => o.name },
			valueAttribute: { type: 'function', default: o => o.value }
		}, false);

		this.options = options;
		this.value = null;
		this.explicitValue = null;
		this.placeholder = null;
		this.select = null;

		this.setPlaceholder(opt.placeholder);
		this.setValue(opt.value);
		this.setDisabled(opt.disabled);

		this._onChange = this._onChange.bind(this);
		this._onAdd = this._onAdd.bind(this);
		this._onRemove = this._onRemove.bind(this);
	}

	setDisabled(disabled) {
		this.disabled = disabled;
		if (this.select) {
			if (disabled) {
				this.select.setAttribute('disabled', 'disabled');
			} else {
				this.select.removeAttribute('disabled');
			}
		}
		return this;
	}

	setOptions(options) {
		this._setEventListener(false);
		this.options = options;

		if (this.select) {
			elem.empty(this.select);
			this._addPlaceholder();
			this._createOptions();
		}

		this._setEventListener(true);
		this.setValue(this.explicitValue);

		return this;
	}

	setPlaceholder(placeholder) {
		placeholder = placeholder || null;
		if (placeholder !== this.placeholder) {
			this._removePlaceholder();
			this.placeholder = placeholder;
			this._addPlaceholder();
			this.setValue(this.explicitValue);
		}
		return this;
	}

	setFocus() {
		if (this.select) {
			this.select.focus();
		}
	}

	/**
	 * Sets the input value
	 * @param {string} value Input value
	 * @returns {this}
	 */
	setValue(value) {
		let oldValue = this.value;
		this.value = value;
		this.explicitValue = value;

		this._verifyValue();

		if (oldValue !== this.value) {
			this._setSelected();

			if (this.opt.onChange) {
				this.opt.onChange(this.value, this);
			}
		}
		return this;
	}

	/**
	 * Gets the selected value
	 * @returns {?string} Selected value. Null if there are no options
	 */
	getValue() {
		return this.value;
	}

	getOptions() {
		return this.options;
	}

	render(el) {
		this.select = elem.create('select', {
			className: 'comp-select form-control' + (this.opt.className ? ' ' + this.opt.className : ''),
			attributes: this.attributes
		});

		this.setDisabled(this.disabled);

		this._addPlaceholder();
		this._createOptions();
		this._setEventListener(true);
		this._setSelected();

		//Execute onChange event if it exists
		this.select.addEventListener("change", this._onChange);

		return elem.append(el, this.select);
	}

	_setEventListener(on) {
		if (!this.select || !this.options || !this.options.on) {
			return;
		}

		if (on) {
			this.options.on('add', this._onAdd);
			this.options.on('remove', this._onRemove);
		} else {
			this.options.off('add', this._onAdd);
			this.options.off('remove', this._onRemove);
		}
	}

	_setSelected() {
		if (!this.select) {
			return;
		}

		if (this.value === null) {
			this.select.selectedIndex = 0;
		} else {
			this.select.value = this.value;
		}
	}

	_verifyValue() {
		// Quick exit if options are not set
		// We keep the set value assuming options are asynchronous
		if (!this.options) {
			return;
		}

		// Loop through options to find if the value matches our string value
		if (typeof this.value === 'string') {
			for (let item of this.options) {
				if (this.value === String(this.opt.valueAttribute(item) || '')) {
					return;
				}
			}
		}

		// Set value to the first option's value if we don't have a placeholder
		if (!this.placeholder) {
			for (let item of this.options) {
				this.value = String(this.opt.valueAttribute(item) || '');
				return;
			}
		}

		this.value = null;
	}

	_onAdd(options, item, idx) {
		// [TODO] Implement
	}

	_onRemove(options, item, idx) {
		// [TODO] Implement
	}

	_onChange(event) {
		this.setValue(this.select.value);
	}

	_addPlaceholder() {
		if (!this.placeholder || !this.select) {
			return;
		}

		let option = elem.create('option');
		option.setAttribute('value', '');
		option.innerHTML = l10n.t(this.placeholder);

		this.select.appendChild(option);

		if (this.value === null) {
			option.setAttribute('selected', 'selected');
		}
	}

	_removePlaceholder() {
		if (!this.placeholder || !this.select) {
			return;
		}

		this.select.removeChild(this.select.firstElementChild);
	}

	_createOptions() {
		if (!this.options) {
			return;
		}

		for (let item of this.options) {
			let option = elem.create('option');
			let value = String(this.opt.valueAttribute(item) || '');
			let name = this.opt.nameAttribute(item);

			option.setAttribute('value', value);
			let classString = '';

			if (this.opt.optionClassName) {
				if (typeof this.opt.optionClassName === 'string') {
					classString = this.opt.optionClassName;
				} else {
					classString = this.opt.optionClassName(item);
				}
			}

			if (classString) {
				let classNames = classString.split(' ');

				for (let className of classNames) {
					option.classList.add(className);
				}
			}

			option.innerHTML = l10n.t(name);

			if (this.value === value) {
				option.setAttribute('selected', 'selected');
			}

			this.select.appendChild(option);
		}
	}

	unrender() {
		if (!this.select) {
			return;
		}

		this.select.removeEventListener('change', this._onChange);
		this._setEventListener(false);
		elem.remove(this.select);
		this.select = null;
	}

	dispose() {
		this.unrender();
		this.options = null;
	}
}

export default Select;
