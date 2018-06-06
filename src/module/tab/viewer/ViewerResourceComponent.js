import { isResError } from 'resclient';
import Elem from 'modapp-base-component/Elem';
import Txt from 'modapp-base-component/Txt';
import CollectionList from 'component/CollectionList';
import Collection from 'modapp-resource/Collection';
import ViewerModelValueComponent from './ViewerModelValueComponent';

class ViewerResourceComponent {

	constructor(resource, path = []) {
		this.resource = resource;

		if (typeof resource.getResourceId === 'function') {
			let rid = resource.getResourceId();
			this.cyclic = path.indexOf(rid) >= 0;
			this.path = path.slice();
			this.path.push(rid);
		}

		this.modelCollection = null;

		this.elem = null;
	}

	render(el) {
		let c;
		if (this.cyclic) {
			c = this._cyclicComponent();
		} else if (this._isError()) {
			c = this._errorComponent();
		} else if (this._isCollection()) {
			c = this._collectionComponent();
		} else {
			c = this._modelComponent();
		}

		this.elem = c;

		return this.elem.render(el);
	}

	_isError() {
		return isResError(this.resource);
	}

	_isCollection(r) {
		return this.resource === null
			? false
			: typeof this.resource[Symbol.iterator] === 'function';
	}

	_errorComponent() {
		return new Elem(n => n.elem('div', { className: 'module-viewer--error' }, [
			n.component(new Txt(this.resource.getResourceId(), { className: 'module-viewer--resource' })),
			n.component(new Txt(this.resource.message, { className: 'module-viewer--error-message' })),
		]));
	}

	_cyclicComponent() {
		return new Elem(n => n.elem('div', { className: 'module-viewer--cycle' }, [
			n.component(new Txt(this.resource.getResourceId() + " (cycle)", { className: 'module-viewer--resource' })),
		]));
	}

	_collectionComponent() {
		return new Elem(n => n.elem('div', { className: 'module-viewer--collection' }, [
			n.component(new Txt(this.resource.getResourceId(), { className: 'module-viewer--resource' })),
			n.component(new CollectionList(this.resource, v => {
				if (typeof v === 'object' && v !== null) {
					return new ViewerResourceComponent(v, this.path);
				}
				let typ = v === null ? 'null' : typeof v;
				return new Txt(String(v), { className: 'module-viewer--' + typ });
			}))
		]));
	}

	_modelComponent() {
		let collection = this._createModelCollection();

		let cb = this._handleModelChange.bind(this, collection);
		this.resource.on('change', cb);
		this.onUnrender = () => this.resource.off('change', cb);

		return new Elem(n => n.elem('div', { className: 'module-viewer--model' }, [
			n.elem('div', [
				n.component(new Txt(this.resource.getResourceId(), { className: 'module-viewer--resource' })),
				n.component(new CollectionList(collection, m => new ViewerModelValueComponent(m.id, this.resource, this.path)))
			])
		]));
	}

	_createModelCollection() {
		let data = [];
		Object.keys(this.resource).forEach(id => {
			if (this.resource.hasOwnProperty(id) && id.substr(0, 1) !== '_') {
				data.push({ id });
			}
		});

		return new Collection({
			data,
			compare: (a, b) => a.id.localeCompare(b.id)
		});
	}

	_handleModelChange(collection, change) {
		if (!this.elem) {
			return;
		}

		for (let id in change) {
			if (change[id] === undefined) {
				collection.add({ id });
			} else if (this.resource[id] === undefined) {
				collection.remove(id);
			}
		}
	}

	unrender() {
		if (this.onUnrender) {
			this.onUnrender();
			this.onUnrender = null;
		}
		this.elem.unrender();
		this.elem = null;
	}
}

export default ViewerResourceComponent;
