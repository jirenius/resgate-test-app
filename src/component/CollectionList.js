import { anim, elem, obj } from 'modapp-utils';
import './CollectionList.css';

/**
 * A list bound to a collection
 */
class CollectionList {
	/**
	 * Creates a CollectionList instance
	 * @param {Collection} collection The collection the table is showing
	 * @param {function} componentFactory A factory function taking the model as argument, returning a component.
	 * @param {object} [opt] Optional parameters.
	 * @param {boolean} [opt.direction] List direction. May be 'row', 'row-reverse', 'column', or 'column-reverse'. Default is 'column'
	 * @param {string} [opt.className] Optional class name.
	 * @param {string} [opt.attributes] Optional key value object for attributes.
	 */
	constructor(collection, componentFactory, opt) {
		obj.update(this, opt, {
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
			classNameFactory: {
				type: '?function'
			},
			disposeComponents: {
				type: 'boolean',
				default: true
			},
			click: {
				type: 'function'
			}
		});

		this.collection = null;
		this.componentFactory = componentFactory;

		this.components = null;
		this.removedComponents = [];

		this._add = this._add.bind(this);
		this._remove = this._remove.bind(this);

		this.setCollection(collection);
	}

	setCollection(collection) {
		collection = collection || null;

		if (collection === this.collection) {
			return;
		}

		if (!this.list) {
			this.collection = collection;
			return;
		}

		this._unrenderComponents();
		this.collection = collection;
		this._renderComponents();
		this._checkSync();
	}

	getCollection() {
		return this.collection;
	}

	/**
	 * Get the component for a model by index
	 * @param {number} idx Index if model
	 * @returns {?Component} Model component, or null if the list isn't rendered, or if index is out of bounds
	 */
	getComponent(idx) {
		if (!this.list) {
			return null;
		}

		let cont = this.components[idx];
		return cont ? cont.component : null;
	}

	/**
	 * Waits for the synchronization of the collection and component list to ensure the collection models matches the rendered components.
	 * Calling this method is necessary when adding/removing collection models, and then wanting to access the components rendered.
	 * Callback will never be called if the CollectionList isn't rendered, or if it unrenders before it has been synchronized.
	 * @param {function} callback Callback function called when collection and component list is synchronized.
	 */
	sync(callback) {
		if (!this.list) {
			return;
		}

		if (this._syncCallbacks) {
			this._syncCallbacks.push(callback);
		} else {
			this._syncCallbacks = [ callback ];
		}

		this._checkSync();
	}

	render(div) {
		this.list = elem.create('ul', {
			className: ('comp-collectionlist ' + (this.className || '')).trim(),
			attributes: this.attributes
		});

		elem.append(div, this.list);
		this._renderComponents();

		return this.list;
	}

	unrender() {
		this._unrenderComponents();
		this._syncCallbacks = null;

		elem.remove(this.list);
		this.list = null;
	}

	_checkSync() {
		// No use checking syncronization if noone cares.
		if (!this._syncCallbacks) {
			return;
		}

		let i = 0, comp, len = this.components.length;
		for (let model of this.collection) {
			// More models in the collection than components
			if (i === len) {
				return;
			}

			comp = this.components[i++];
			if (model !== comp.model) {
				return;
			}
		}

		// Do we have more components?
		if (i !== length) {
			return;
		}

		// We are in sync
		for (let cb of this._syncCallbacks) {
			cb();
		}
		this._syncCallbacks = null;
	}

	_renderComponents() {
		if (!this.collection) {
			return;
		}

		this.components = [];
		let idx = 0;

		for (let model of this.collection) {
			let component = this.componentFactory(model, idx);
			let li = document.createElement('li');
			this.components.push({ model, component, li });

			if (this.classNameFactory) {
				let className = this.classNameFactory(model);
				if (className) {
					li.className = className;
				}
			}

			this.list.append(li);
			if (component) {
				component.render(li);
			}
			idx++;
		}

		this._setEventListener(true);
	}

	_unrenderComponents() {
		if (!this.collection) {
			return;
		}

		for (let cont of this.components) {
			this._removeComponent(cont);
		}
		this.components = null;

		for (let cont of this.removedComponents) {
			this._removeComponent(cont);
		}
		this.removedComponents = [];

		this._setEventListener(false);
	}

	// Callback when the collection have an add event
	_add(e) {
		// Assert component wasn't unrendered by another event handler
		if (!this.list) {
			return;
		}

		let component = this.componentFactory(e.item, e.idx);
		let li = document.createElement('li');
		let cont = { model: e.item, component, li };
		this.components.splice(e.idx, 0, cont);

		if (this.classNameFactory) {
			let classString = this.classNameFactory(e.item);
			if (classString) {
				li.className = classString;
			}
		}

		li.style.display = 'none';
		// Append last?
		if (this.components.length - 1 === e.idx) {
			this.list.append(li);
		} else {
			this.list.insertBefore(li, this.components[e.idx + 1].li);
		}

		if (component) {
			component.render(li);
		}

		cont.token = anim.slideVertical(li, true, { reset: true });
		this._checkSync();
	}


	// Callback when the collection have a remove event
	_remove(e) {
		// Assert component wasn't unrendered by another event handler
		if (!this.list) {
			return;
		}

		let cont = this.components[e.idx];
		this.components.splice(e.idx, 1);
		this.removedComponents.push(cont);

		anim.stop(cont.token);
		cont.token = anim.slideVertical(cont.li, false, {
			callback: () => {
				// Has the component already been removed from a call to unrender()?
				let idx = this.removedComponents.indexOf(cont);
				if (idx >= 0) {
					this.removedComponents.splice(idx, 1);
					this._removeComponent(cont);
				}
			}
		});

		this._checkSync();
	}

	_removeComponent(cont) {
		if (!this.list) {
			return;
		}

		anim.stop(cont.token);
		let component = cont.component;
		if (component) {
			component.unrender();
			if (this.disposeComponents && component.dispose) {
				component.dispose();
			}
		}

		this.list.removeChild(cont.li);
	}

	_setEventListener(on) {
		if (this.collection && this.collection.on) {
			if (on) {
				this.collection.on('add', this._add);
				this.collection.on('remove', this._remove);
			} else {
				this.collection.off('add', this._add);
				this.collection.off('remove', this._remove);
			}
		}
	}

	dispose() {
		if (this.list) {
			this.unrender();
		}
	}
}

export default CollectionList;
