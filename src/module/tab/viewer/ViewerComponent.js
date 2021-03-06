import { Button, Elem, Html, Transition } from 'modapp-base-component';
import { ModelComponent } from 'modapp-resource-component';
import l10n from 'modapp-l10n';
import Input from 'component/Input';
import ComponentLoader from 'component/ComponentLoader';
import ViewerResourceComponent from './ViewerResourceComponent';
import './ViewerComponent.css';

class ViewerComponent {

	constructor(module, model) {
		this.module = module;
		this.model = model;

		this.loadedRID = null;
		this.elem = null;
	}

	render(el) {
		this.elem = new Elem(n =>
			n.elem('div', { className: 'module-viewer' }, [
				n.component(new Html(l10n.l('viewer.editInstruction', `<p>Enter a resource ID to view it together with all linked resources.</p><p>The viewer can handle all kinds of resources including cyclic and error references.</p><p>Used for testing subscribing and unsubscribing to any sort of linked resource.</p>`), { tagName: 'div' })),
				n.elem('div', [
					n.text('Web resource: '),
					n.elem('a', { attributes: {
						href: this.module.api.getWebResourceUri('viewerService.collection'),
						target: '_blank'
					}}, [
						n.text(this.module.api.getWebResourceUri('viewerService.collection'))
					])
				]),
				n.elem('hr'),
				n.elem('div', { className: 'module-viewer--view' }, [
					n.component(new ModelComponent(
						this.model,
						new Input({
							value: this.model.rid,
							onChange: value => this.model.set({ rid: value }),
							placeholder: l10n.l('viewer.resourceId', `Resource ID`)
						}),
						(m, c) => {
							c.setValue(m.rid);
						}
					)),
					n.component(new ModelComponent(
						this.model,
						new Button(l10n.l('viewer.view', `View`), () => this._clickView()),
						(m, c) => c.setDisabled(!m.rid)
					)),
				]),
				n.elem('hr'),
				n.component('view', new Transition(null))
			])
		);

		this._clickView();

		return this.elem.render(el);
	}

	unrender() {
		this.elem.unrender();
		this.elem = null;
		this.loadedRID = null;
	}

	_clickView() {
		let rid = this.model.rid.trim() || null;

		if (rid === this.loadedRID) {
			return;
		}

		this.loadedRID = null;
		let view = this.elem.getNode('view');

		if (!rid) {
			view.fade(null);
			return;
		}

		view.fade(new ComponentLoader(this.module.api.get(rid)
			.catch(err => err)
			.then(resource => new ViewerResourceComponent(resource))
		));
	}
}

export default ViewerComponent;
