import Collection from 'modapp-resource/Collection';
import Model from 'modapp-resource/Model';
import CollectionList from 'component/CollectionList';
import Elem from 'modapp-base-component/Elem';
import Txt from 'modapp-base-component/Txt';
import * as obj from 'modapp-utils/obj';
import * as elem from 'modapp-utils/elem';
import l10n from 'modapp-l10n';
import './Form.css';

/**
 * Form field object
 * @typedef {Object} component/Form~field
 * @property {string} id Id of field
 * @property {string|LocaleString} [label] Field label
 * @property {string|LocaleString} [text] Description text
 * @property {function} [modelToField] Converts model value to field value. Defaults to no change: value => value
 * @property {function} [fieldToModel] Converts field value to model value. Defaults to no change: value => value
 * @property {component/Form~fieldComponentFactory} componentFactory Form field component
 * @property {boolean} [required] Flag if field is required. Defaults to false.
 * @property {function} [validate] Validate callback function. Defaults to null.
 */

/**
 * Form field component factory function
 * @callback component/Form~fieldComponentFactory
 * @param {function} onChange Change callback function. Must be called whenever the field's value is changed.
 * @returns {component/Form~fieldComponent} Field component
 */

/**
 * Form field component
 * @typedef {Object} component/Form~fieldComponent
 * @property {function} render Component render function
 * @property {function} unrender Component unrender function
 * @property {function} setValue Set value callback
 * @property {function} getValue Get value callback
 * @property {function} setDisabled Sets whether field is disabled. Parameter is a boolean that is true if field is disabled, otherwise false.
 * @property {function} setError Sets whether field has an error. Parameter is a boolean that is true on error, otherwise false.
 */

let incrementalId = 0;

const FIELD_DEF = {
	id: { type: 'string' },
	label: { type: 'any' },
	text: { type: 'any' },
	getvalue: { type: 'function', default: (m, id) => m[id] },
	setValue: { type: 'function', default: (v, m, id) => { let p = {}; p[id] = v; m.set(p); } },
	componentFactory: { type: 'function' },
	required: { type: 'boolean' },
	validate: { type: '?function' }
};

/**
 * A form component.
 * Since it listens to the model changes, it needs to be disposed when no longer used.
 */
class Form {

	/**
	 * Creates a Form instance.
	 * @param {module:modapp~EventBus} eventBus Event bus.
	 * @param {string} namespace Event bus namespace.
	 * @param {Array.<component/Form~field>} fields Fields array
	 * @param {object} [opt] Optional parameters
	 * @param {component/Form~SetModel} [opt.model] Set-able model
	 * @param {string} [opt.className] Class name
	 * @param {object} [opt.values] Initial values. Ignored if a model is provided.
	 */
	constructor(eventBus, namespace, fields, opt = {}) {
		this.id = incrementalId++;
		this.eventBus = eventBus;
		this.namespace = namespace;

		obj.update(this, opt, {
			values: {
				type: '?object'
			},
			model: {
				type: '?object'
			},
			className: {
				type: '?string'
			},
			attributes: {
				type: '?object'
			},
			direction: {
				type: 'string',
				default: 'column',
			},
			legend: {
				type: 'any'
			},
			horizontal: {
				type: 'boolean'
			}
		});

		this.validatePromise = null;
		this._onModelChange = this._onModelChange.bind(this);

		if (!this.model) {
			this.model = new Model(this.eventBus, this._getNamespace('model'), {
				data: opt.values
			});
		}

		this.model.on('change', this._onModelChange);

		this.fields = new Collection(
			this.eventBus,
			this._getNamespace('fields')
		);
		this.collectionList = null;
		this.legendText = null;
		this.fieldset = null;

		for (let field of fields) {
			this._addField(field);
		}
		this._validateForm();
	}

	addField(field, idx) {
		idx = this._addField(field, idx);

		this._validateForm();
		return idx;
	}

	getFields() {
		return this.fields;
	}

	_addField(field, idx) {
		let id = field.id;

		if (!id) {
			throw new Error("Missing id property");
		}

		if (this.fields.get(id)) {
			throw new Error(`Id ${id} already exists`);
		}

		if (!field.componentFactory) {
			throw new Error("Missing componentFactory property");
		}

		let fieldCont = obj.copy(field, FIELD_DEF);
		fieldCont.component = field.componentFactory(this._getValue(field), this._setValue.bind(this, field), this._getFieldName(id));
		fieldCont.field = field;
		this._setValue(field, fieldCont.component.getValue());

		idx = this.fields.add(fieldCont, idx);
		this._validateField(id);

		return idx;
	}

	_validateField(id) {
		let field = this.fields.get(id);
		let validatePromise = null;
		let required = field.required;
		let value = this.model[id];
		let isEmpty = value === '' || value === null;;

		if (isEmpty) {
			if (required) {
				validatePromise = Promise.resolve(l10n.l('component.form.errorRequired', `Field is required`)).then(err => {
					// Assert it is the most recent validation
					if (field.validatePromise === validatePromise) {
						this._setError(id, err, true);
					}
					return err;
				});
			}
		} else if (field.validate) {
			validatePromise = field.validate(value);

			if (validatePromise) {
				validatePromise = validatePromise
					.then(err => {
						// Assert it is the most recent validation
						if (field.validatePromise === validatePromise) {
							this._setError(id, err, false);
						}
						return err;
					});
			}
		}

		if (!validatePromise) {
			this._setError(id, null, required);
		}

		field.validatePromise = validatePromise;
	}

	_setError(id, err, isRequired) {
		if (!this.collectionList) {
			return;
		}

		this.collectionList.sync(() => {
			let idx = this.fields.indexOf(id);
			if (idx === -1) {
				return;
			}

			let node = this.collectionList.getComponent(idx);
			if (!node) {
				return;
			}

			let el = node.getNode('field');
			el.classList.remove('has-error');
			el.classList.remove('has-warning');
			if (err) {
				if (isRequired) {
					el.classList.add('has-warning');
				} else {
					el.classList.add('has-error');
				}
			}
		});

		// [TODO] Implement displaying of error message somehow
	}

	_setValue(field, value) {
		let props = {};
		props[field.id] = field.fieldToModel ? field.fieldToModel(value) : value;
		this.model.set(props);
	}

	_getValue(field) {
		let v = this.model[field.id];
		return field.modelToField
			? field.modelToField(v)
			: v;
	}

	// Deprecated?
	_setFormErrors() {
		for (let fieldCont of this.fields) {
			let err = fieldCont.error;
			if (err) {
				this._setError(fieldCont.id, err.message, err.required);
			} else {
				this._setError(fieldCont.id, null, false);
			}
		}
	}

	_validateForm() {
		this.validatePromise = null;

		let promises = [];
		let fields = [];
		for (let field of this.fields) {
			if (field.validatePromise) {
				promises.push(field.validatePromise);
				fields.push(field.field);
			}
		}

		if (!promises.length) {
			this.model.set({ isValid: true, isValidating: false, errors: null });
			this.validatePromise = Promise.resolve();
			return;
		}

		this.model.set({ isValid: false, isValidating: true });

		let promiseAll;
		promiseAll = Promise.all(promises).then(result => {
			let errors = null;
			for (let i = 0; i < result.length; i++) {
				if (result[i]) {
					if (!errors) {
						errors = [];
					}

					errors.push({
						field: fields[i],
						error: result[i]
					});
				}
			}

			// Assert a new validation is not running
			if (this.validatePromise === promiseAll) {
				this.model.set({
					isValid: !errors,
					isValidating: false,
					errors: errors
				});

				if (!errors) {
					for (var field in this.fields) {
						field.validatePromise = null;
					}
				}
			}

			return errors;
		});

		this.validatePromise = promiseAll;
	}

	validate() {
		return this.validatePromise;
	}

	removeField(fieldId) {
		let field = this.fields.get(fieldId);
		if (!field) {
			return -1;
		}

		if (field.component.dispose) {
			field.component.dispose();
		}

		this.fields.remove(fieldId);
	}

	render(div) {
		if (this.collectionList) {
			throw "Already rendered";
		}

		this.fieldset = elem.create('fieldset');

		this.collectionList = new CollectionList(
			this.fields,
			m => {
				return new Elem(n =>
					n.elem('field', 'div', { className: 'row field' }, [
						n.elem('div', { className: 'four columns' }, [
							n.component(new Txt(m.field.label, {
								tagName: 'label',
								attributes: {
									for: this._getFieldName(m.id)
								}
							})),
						]),
						n.elem('div', { className: 'eight columns' }, [
							n.component(m.component),
						]),
						n.component(m.fieldText
							? new Txt(m.field.text, {
								tagName: 'small',
								className: 'form-text text-muted twelve column'
							})
							: null
						)
					])
				);
			}, {
				disposeComponents: false,
				direction: this.direction,
				className: 'comp-form' + (this.horizontal ? ' form-horizontal' : '') + (this.className ? ' ' + this.className : ''),
				attributes: this.attributes
			}
		);

		elem.append(div, this.fieldset);

		if (this.legend) {
			this.legendText = new Txt(this.legend, { tagName: 'legend' });
			this.legendText.render(this.fieldset);
		}

		let el = this.collectionList.render(this.fieldset);
		this._setFormErrors();

		return el;
	}

	_getNamespace(subname) {
		return this.namespace ? this.namespace + '.' + subname : subname;
	}

	_getFieldName(fieldId) {
		return `form-${this.id}-field-${fieldId}`;
	}

	_onModelChange(changed) {
		let validate = false;

		for (let key in changed) {
			let field = this.fields.get(key);
			if (field) {
				field.component.setValue(this._getValue(field));
				this._validateField(key);
				validate = true;
			}
		}

		if (validate) {
			this._validateForm();
		}
	}

	_onChange(fieldId, value) {
		let props = {};
		props[fieldId] = value;
		this.model.set(props);
	}

	unrender() {
		if (!this.collectionList) {
			return;
		}

		if (this.legendText) {
			this.legendText.unrender();
			this.legendText = null;
		}
		this.collectionList.unrender();
		this.collectionList = null;
	}

	/**
	 * Gets a form field component by id
	 * @param {string} fieldId Id of the field
	 * @returns {component/Form~fieldComponent|undefined} Field component, or undefined if id doesn't exist
	 */
	getField(fieldId) {
		let field = this.fields.get(fieldId);
		if (field) {
			return field.component;
		}

		return undefined;
	}

	getModel() {
		return this.model;
	}

	dispose() {
		this.model.off('change', this._onModelChange);
	}
}

export default Form;
