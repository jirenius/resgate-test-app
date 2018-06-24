import { anim, elem } from 'modapp-utils';
import './ComponentList.css';

/**
 * ComponentList is a component for displaying a list of other components.
 */
class ComponentList {

	/**
	 * Creates a new ComponentList instance
	 * @param {object} [opt] Optional settings
	 * @param {Array.<object>} opt.components An array of components to add to the list
	 */
	constructor(opt = {}) {
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
			disposeComponents: {
				type: 'boolean',
				default: true
			},
			click: {
				type: 'function'
			}
		});
		this.components = [];

		// Add components
		if (opt.components) {
			for (var i = 0; i < opt.components.length; i++) {
				this.add(opt.components[i], false);
			}
		}

		this.ul = null;
	}

	/**
	 * Adds an component
	 * @param {object} component Component object to add
	 * @param {Number=} idx Index position for component. A non-number value means append. Defaults to append.
	 * @param {boolean=} animate If false, the component will be added without animation. Default is true.
	 */
	add(component, idx, animate = true) {
		// Detect optional parameters
		if (typeof idx == 'boolean') {
			// (component, animate)
			animate = idx;
			idx = undefined;
		}

		if (typeof idx != 'number' || idx >= this.components.length) {
			idx = this.components.length;
			this.components.push(component);
		} else if (idx <= 0) {
			idx = 0;
			this.components.unshift(component);
		} else {
			this.components.splice(idx, 0, component);
		}

		if (!this.ul) return;

		animate = animate === undefined ? true : animate;

		let li = elem.create('li');
		li.style.display = 'none';

		if (idx < this.ul.children.length)
			this.ul.insertBefore(li, this.ul.children[idx]);
		else
			this.ul.appendChild(li);

		component.render(li);

		// Slide in the component
		if (animate) {
			anim.slideVertical(li, true, { reset: true });
		}
	}

	/**
	 * Removes a component
	 * @param {Number|Component} idx Index value of the component, or the component.
	 * @param {boolean=} animate If false, the component will be removed without animation. Default is true.
	 * @returns {Number} Returns index position of the removed component, or -1 if it was not in the list.
	 */
	remove(idx, animate = true) {
		if (typeof idx == 'object') {
			idx = this.getIndex(idx);
			if (idx == -1) return idx;
		} else if (idx < 0 || idx >= this.components.length) {
			return -1;
		}

		let component = this.components[idx];

		this.components.splice(idx, 1);

		if (this.ul) {
			let li = this.ul.children[idx];
			if (animate) {
				anim.slideVertical(li, false, {
					callback: () => component.unrender()
				});
			} else {
				component.unrender();
			}
		}

		return idx;
	}

	render(div) {
		if (this.ul) throw "ComponentList is already rendered";

		this.ul = elem.create('ul', { className: 'comp-componentList' });

		elem.append(div, this.ul);

		for (let i = 0, component; (component = this.components[i]); i++) {
			let li = elem.append(this.ul, elem.create('li'));
			component.render(li);
		}

		return this.ul;
	}

	unrender() {
		if (!this.ul) return;

		for (let i = 0; i < this.components.length; i++) {
			this.components[i].unrender();
		}

		elem.empty(this.ul);
		this.ul = null;
	}

	/**
	 * Gets the zero-based position index of a component.
	 * @param {Component} component Component
	 * @returns {Number} Returns the index of the component, or -1 if it is not in the list.
	 */
	getIndex(component) {
		return this.components.indexOf(component);
	}
}

export default ComponentList;
