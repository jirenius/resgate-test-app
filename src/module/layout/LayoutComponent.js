import ModelComponent from 'modapp-resource-component/ModelComponent';
import CollectionList from 'component/CollectionList';
import ComponentLoader from 'component/ComponentLoader';
import Transition from 'component/Transition';
import Elem from 'modapp-base-component/Elem';
import ModelTxt from 'modapp-resource-component/ModelTxt';
import Txt from 'modapp-base-component/Txt';
import Model from 'modapp-resource/Model';
import l10n from 'modapp-l10n';
import './Layout.css';

class LayoutComponent {

	constructor(app, module, tabs) {
		this.app = app;
		this.module = module;
		this.tabs = tabs;

		this.state = new Model(this.app.eventBus, 'module.layout.state');
	}

	render(el) {
		if (!this.state.current) {
			for (let first of this.tabs) {
				this.state.set({ current: first.id });
				break;
			}
		}

		this.node = new Elem(n =>
			n.elem('div', { className: 'module-layout' }, [
				n.elem('div', { className: 'module-layout--header' }, [
					n.component(new Txt(`Resgate Test Client`, { tagName: 'h2' })),
					n.component(new CollectionList(
						this.tabs,
						(tab, i) => new ModelComponent(
							this.state,
							new ModelTxt(tab, m => m.name, {
								events: {
									click: () => this._onTabClick(tab, i)
								}
							}),
							(m, c) => {
								c.setClassName('clickable' + (m.current == tab.id ? ' active' : ''));
							}
						),
						{
							className: 'module-layout--tabs'
						}
					)),
				]),
				n.elem('div', { className: 'module-layout--main' }, [
					n.component('main', new Transition())
				])
			])
		);

		this._setMain();

		return this.node.render(el);
	}

	unrender() {
		this.node.unrender();
		this.node = null;
	}

	setTab(tabId) {
		if (tabId === this.state.current) {
			return;
		}

		let tab = this.tabs.get(tabId);
		if (!tab) {
			return;
		}

		let oldTabId = this.state.current;
		this.state.set({ current: tab.id });

		if (!this.node) {
			return;
		}

		let main = this.node.getNode('main');
		let idx = this.tabs.indexOf(tabId);
		let oldIdx = this.tabs.indexOf(oldTabId);
		let component = this._getTabComponent(tab);

		if (idx < oldIdx) {
			main.slideRight(component, tab.dispose);
		} else {
			main.slideLeft(component, tab.dispose);
		}
	}

	_getTabComponent(tab) {
		let component = tab.componentFactory();
		// Is it really a component?
		if (component.render && component.unrender) {
			return component;
		}

		// Is it a promise?
		return component.then
			? new ComponentLoader(component.catch(err => this._brokenTab(err)))
			: this._brokenTab({ code: 'module.layout.tabIsNotATab', message: `This tab isn't a tab at all!` });
	}

	_setMain() {
		let tab = this.tabs.get(this.state.current);
		let main = this.node.getNode('main');
		let component = this._getTabComponent(tab);
		main.set(component, tab.dispose);
	}

	_brokenTab(err) {
		console.log("Broken tab: ", err);
		return new Elem(n =>
			n.elem('div', { className: 'module-layout--broken-tab' }, [
				n.component(new Txt(l10n.l('layout.info', `An error occurred when loading the tab`), { tagName: 'h3' })),
				n.component(new Txt(l10n.l(err.code, err.message, err.data), { tagName: 'pre' }))
			])
		);
	}

	_onTabClick(tab, i) {
		console.log("TAB CLICKED: ", tab.id);
		this.setTab(tab.id);
	}
}

export default LayoutComponent;
