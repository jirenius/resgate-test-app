import { anim, elem } from 'modapp-utils';
import WaitOverlay from 'component/WaitOverlay';

/**
 * A component wrapper that allows asynchronous loading of the inner component.
 * While the inner component is loading, a spinner will be showing
 * @module component/Elem
 */
class ComponentLoader {

	/**
	 * Creates a ComponentLoader instance
	 * @param {Component|Promise.<Component>} componentPromise Component or a promise to a component.
	 */
	constructor(componentPromise) {
		this.div = null;
		// Inner component/promise to component
		this.componentPromise = null;
		this.renderedComponent = null;
		this.overlay = null;
		this.animId = null;

		this.setComponent(componentPromise);
	}

	render(div) {
		if (this.div) throw "Already rendered";

		this.div = elem.create('div', { className: 'comp-componentLoader' });

		elem.append(div, this.div);

		if (this.componentPromise) {
			// If pending, show loader
			if (this._isPending(this.componentPromise)) {
				this.overlay = new WaitOverlay(this.div, 'medium', false);
			}

			Promise.resolve(this.componentPromise)
				.then(function(oldComponent, component) {
					// Have we been unrendered
					if (!this.div) return;
					// Has the component changed
					if (oldComponent !== this.componentPromise) return;

					// Close overlay
					if (this.overlay) {
						this.overlay.close();
						this.overlay = null;

						let el = component.render(this.div);
						el.style.opacity = '0';
						this.animId = anim.fade(el, 1);
					} else {
						component.render(this.div);
					}

					this.renderedComponent = component;
				}.bind(this, this.componentPromise))
				.catch(e => {
					if (this.overlay) {
						this.overlay.close();
					}
					throw e;
				});
		}

		return this.div;
	}

	unrender() {
		if (!this.div) return;

		// Close overlay if needed
		if (this.overlay) {
			this.overlay.close(false);
		}

		// Stop any ongoing animation
		anim.stop(this.animId);
		this.animId = null;

		// Unrender component if rendered
		if (this.renderedComponent) {
			this.renderedComponent.unrender();
			this.renderedComponent = null;
		}

		elem.empty(this.div);
		this.div = null;
	}

	/**
	 * Sets a component that is to be loaded
	 * @param {Component|Promise.<Component>} componentPromise Component or promise of a component
	 * @returns {this}
	 */
	setComponent(componentPromise) {
		if (componentPromise === this.componentPromise) {
			return this;
		}

		if (!this.div) {
			this.componentPromise = componentPromise;
			return this;
		}

		throw "Not implemented";
	}

	_isPending(promise) {
		let pending = true;
		Promise.resolve(promise).then(() => pending = false, () => pending = false);
		return pending;
	}
}

export default ComponentLoader;
