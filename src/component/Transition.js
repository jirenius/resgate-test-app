import { anim, elem } from 'modapp-utils';
import './Transition.css';

/**
 * A component used for doing transition between one component to another.
 */
class Transition {

	/**
	 * Creates a Transition instance
	 * @param {object=} opt Optional parameters
	 * @param {number=} opt.distance Swipe distance in pixels. Defaults to 64.
	 * @param {number=} opt.duration Swipe duration in milliseconds. Defaults to 150.
	 */
	constructor(opt = {}) {
		this.opt = Object.assign({}, opt);

		this.div = null;
		this.animId = null;
		this.current = null;
		this.rendered = null;
		this.contDiv = null;
	}

	getComponent() {
		return this.current;
	}

	render(div) {
		if (this.div) throw "Component already rendered";

		this.div = elem.create('div', { className: 'comp-transition' });

		elem.append(div, this.div);
		this._renderComponent();

		return this.div;
	}

	unrender() {
		if (!this.div) return;

		anim.stop(this.animId);
		this.animId = null;
		this._unrenderComponent();

		elem.remove(this.div);
		this.div = null;
	}

	fade(component) {
		this._setComponent(component, 0);
		return this;
	}

	slideLeft(component) {
		this._setComponent(component, -1);
		return this;
	}

	slideRight(component) {
		this._setComponent(component, 1);
		return this;
	}

	set(component) {
		component = component || null;

		// Is the component already current?
		if (this._isEqual(this.current, component)) return this;

		this.current = component;

		if (!this.div) return this;

		this.animId = anim.stop(this.animId);

		// Is the component already rendered?
		if (this._isEqual(this.rendered, component)) {
			this.contDiv.style.opacity = '';
			this.contDiv.style.left = '';
		} else {
			// Unrender previously rendered component
			this._unrenderComponent();
			// Render the current component
			this._renderComponent();
		}

		return this;
	}

	_setComponent(component, direction) {
		component = component || null;

		// Is the component already current?
		if (this._isEqual(this.current, component)) return;

		this.current = component;

		if (!this.div) return;

		this.animId = anim.stop(this.animId);

		// Check if the rendered page matches the one we want
		if (this._isEqual(this.rendered, this.current)) {
			// Swipe it back in from current state
			this.animId = anim.swipeIn(this.contDiv, direction, {
				reset: false,
				callback: () => this.animId = null,
				duration: this.opt.duration,
				distance: this.opt.distance
			});
			return;
		}

		// No rendered component. We can just render the new one.
		if (!this.rendered) {
			this._renderComponent(direction);
			return;
		}

		// Unrender the currently rendered tab
		this.animId = anim.swipeOut(this.contDiv, direction, {
			reset: false,
			callback: () => {
				this._unrenderComponent();
				this._renderComponent(direction);
			},
			duration: this.opt.duration,
			distance: this.opt.distance
		});
	}

	_isEqual(componentA, componentB) {
		if (componentA === componentB) return true;
		if (!componentA || !componentB) return false;
		if (!componentA.hasOwnProperty('id') || !componentB.hasOwnProperty('id')) return false;
		return componentA.id === componentB.id;
	}

	_unrenderComponent() {
		if (!this.rendered) return;

		if (this.rendered.unrender) {
			this.rendered.unrender();
		}
		this.contDiv = null;
		this.rendered = null;
		elem.empty(this.div);
	}

	_renderComponent(direction) {
		if (!this.current) return;

		// Create container div in which content will be rendered
		let div = elem.append(this.div, elem.create('div', { className: 'comp-transition-cont' }));

		this.current.render(div);

		this.rendered = this.current;
		this.contDiv = div;

		if (typeof direction == 'number') {
			this.animId = anim.swipeIn(this.contDiv, direction, {
				callback: () => this.animId = null,
				duration: this.opt.duration,
				distance: this.opt.distance
			});
		}
	}
}

export default Transition;
