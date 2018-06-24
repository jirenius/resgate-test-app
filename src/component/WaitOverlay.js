import { anim, elem } from 'modapp-utils';
import './WaitOverlay.css';

/**
 * A WaitOverlay shows a wait spinner as an overlay.
 * The overlay inherits the background color of the container element
 */
class WaitOverlay {

	/**
	 * Creates a WaitOverlay instance
	 * @param {HTMLElement} div Element in which to display the overlay spinner. Should be relative or absolute positioned
	 * @param {string=} size Size of the spinner. May be 'small', 'medium', or 'large'. Default is small
	 * @param {boolean=} animate Fade in the overlay if true, or remove it instantly if false. Default is true.
	 */
	 constructor(div, size = 'small', animate = true) {

		// Detect optional parameters
		if (typeof size == 'boolean') {
			// (div, animate)
			animate = size;
			size = 'small';
		}

		this.overlay = elem.create('div', { className: 'comp-waitoverlay' });
		this.loader = elem.create('div', { className: 'comp-waitoverlay-loader ' + size });
		elem.append(this.loader, elem.create('div'));
		this.overlayAnimId = null;
		this.layoutAnimId = null;

		elem.append(div, this.overlay);
		elem.append(div, this.loader);

		if (animate) {
			var overlayOpac = window.getComputedStyle(this.overlay).getPropertyValue('opacity');
			var loaderOpac = window.getComputedStyle(this.loader).getPropertyValue('opacity');

			this.overlay.style.opacity = '0';
			this.loader.style.opacity = '0';
			this.overlayAnimId = anim.fade(this.overlay, overlayOpac);
			this.layoutAnimId = anim.fade(this.loader, loaderOpac);
		}
	}

	/**
	 * Closes the WaitOverlay
	 * @param {boolean} animate Fade out the overlay if true, or remove it instantly if false. Default is true.
	 */
	close(animate = true) {
		if (!this.overlay) return;

		animate = typeof animate == 'boolean' ? animate : true;

		if (animate) {
			anim.stop(this.overlayAnimId);
			anim.stop(this.layoutAnimId);
			anim.fade(this.loader, 0);
			anim.fade(this.overlay, 0, { callback: this._remove.bind(this) });
		} else {
			this._remove();
		}
	}

	_remove() {
		elem.remove(this.overlay);
		elem.remove(this.loader);
		this.overlay = null;
		this.loader = null;
	}
}

export default WaitOverlay;
