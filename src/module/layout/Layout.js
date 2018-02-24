import Collection, { sortOrderCompare } from 'modapp-resource/Collection';
import LayoutComponent from './LayoutComponent';

/**
 * Layout draws the main layout wireframe
 */
class Layout {

	constructor(app, params) {
		this.app = app;

		this.app.require([], this._init.bind(this));
	}

	_init(module) {
		this.module = module;
		this.tabs = new Collection(this.app.eventBus, 'module.layout.tabs', {
			compare: sortOrderCompare
		});
		this.component = new LayoutComponent(this.app, this.module, this.tabs);

		this.app.setComponent(this.component);
	}

	/**
	 * Add tab
	 * @param {object} tab Tab object
	 * @param {string} tab.id Tab ID
	 * @param {string|LocaleString} tab.name Name
	 * @param {function} tab.componentFactory Component factory
	 * @param {function} [tab.dispose] Component dispose
	 * @param {number} tab.sortOrder Sort order
	 * @returns {this}
	 */
	addTab(tab) {
		this.tabs.add(tab);
		return this;
	}

	/**
	 * Remove tab
	 * @param {string} tabId Tab ID
	 * @returns {this}
	 */
	removeTab(tabId) {
		this.tabs.remove(tabId);
		return this;
	}

	dispose() {
		this.app.unsetComponent(this.component);
		this.component = null;
	}
}

export default Layout;
