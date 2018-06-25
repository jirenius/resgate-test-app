import { Elem, Transition, Txt } from 'modapp-base-component';
import { ModelRadio, ModelInput, ModelTxt, generateName } from 'modapp-resource-component';
import l10n from 'modapp-l10n';
import CollectionList from 'component/CollectionList';
import ComponentLoader from 'component/ComponentLoader';

const STATE_NONE = 'none';
const STATE_ALL = 'all';
const STATE_QUERY = 'query';

class NotesComponent {

	constructor(module, model) {
		this.module = module;

		this.model = model;

		// Bind callbacks
		this._onChange = this._onChange.bind(this);
	}

	render(el) {
		let name = generateName();
		this.elem = new Elem(n => n.elem('div', [
			n.elem('div', { className: 'module-notes--radios' }, [
				this._radioButton(n, name, l10n.l('notes.all', `All`), STATE_ALL),
				this._radioButton(n, name, l10n.l('notes.none', `None`), STATE_NONE),
				this._radioButton(n, name, l10n.l('notes.query', `Query`), STATE_QUERY)
			]),
			n.elem('div', { className: 'module-notes--query' }, [
				this._numberInput(n, l10n.l('notes.start', `Start`), 'start', 0),
				this._numberInput(n, l10n.l('notes.limit', `Limit`), 'limit', 1)
			]),
			n.component('main', new Transition())
		]));

		this._setEventListeners(true);
		this._setCollection();
		return this.elem.render(el);
	}

	unrender() {
		this._setEventListeners(false);
		this.elem.unrender();
		this.elem = null;
	}

	_radioButton(n, name, label, state) {
		return n.elem('label', [
			n.component(new ModelRadio(
				this.model,
				(m, c, changed) => c.setChecked(m.state === state),
				{
					attributes: { name },
					events: { change: (ctx, ev) => ev.target.checked ? this.model.set({ state: state }) : null }
				}
			)),
			n.component(new Txt(label, { tagName: 'small' }))
		]);
	}

	_numberInput(n, label, prop, min) {
		return n.elem('label', { className: 'module-notes--input' }, [
			n.component(new Txt(label, { tagName: 'small' })),
			n.component(new ModelInput(this.model, (m, c, changed) => {
				c.setDisabled(m.state !== STATE_QUERY).setValue(m[prop]);
			}, {
				events: {
					input: (ctx, ev) => {
						let o = {};
						o[prop] = ev.target.value;
						this.model.set(o);
					}
				},
				attributes: {
					type: 'number',
					min: min
				}
			})),
		]);
	}

	_setEventListeners(on) {
		if (on) {
			this.model.on('change', this._onChange);
		} else {
			this.model.off('change', this._onChange);
		}
	}

	_onChange() {
		this._setCollection();
	}

	_setCollection() {
		if (!this.elem) {
			return;
		}

		if (this.model.state === STATE_NONE) {
			this.elem.getNode('main').fade(null);
			return;
		}

		let rid = this.model.state === STATE_QUERY
			? `notesService.notes?start=${encodeURIComponent(this.model.start)}&limit=${encodeURIComponent(this.model.limit)}`
			: 'notesService.notes';

		this.elem.getNode('main').fade(new ComponentLoader(this.module.api.get(rid).then(notes => {
			return new CollectionList(notes, model => new Elem(n =>
				n.elem('div', { className: 'module-notes--note' }, [
					n.elem('div', { className: 'module-notes--note-container' }, [
						n.elem('div', [
							n.component(new ModelTxt(model, m => String(m.id), { className: 'module-notes--note-id' })),
							n.component(new ModelTxt(model, m => String(m.message), { className: 'module-notes--note-id' }))
						])
					])
				])
			));
		})));
	}
}

export default NotesComponent;
