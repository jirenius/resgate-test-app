import CollectionList from 'component/CollectionList';
import ModelTxt from 'modapp-resource-component/ModelTxt';
import Elem from 'modapp-base-component/Elem';
import l10n from 'modapp-l10n';

/**
 * Notes adds the notes tab to the layout module
 * @module module/Notes
 */
class Notes {

	constructor(app, params) {
		this.app = app;

		this.app.require([ 'layout', 'api' ], this._init.bind(this));
	}

	_init(module) {
		this.module = module;

		this.module.layout.addTab({
			id: 'notes',
			name: l10n.l('module.notes.notes', `Notes`),
			sortOrder: 30,
			componentFactory: () => this.module.api.getResource('notesService.notes?start=0&limit=5').then(notes => {
				return new CollectionList(notes, model => new Elem(n =>
					n.elem('div', { className: 'module-notes--note' }, [
						n.elem('div', [
							n.text('Id: '),
							n.component(new ModelTxt(model, m => String(m.id)))
						]),
						n.elem('div', [
							n.text('Message: '),
							n.component(new ModelTxt(model, m => String(m.message)))
						])
					])
				));
			})
		});
	}

	dispose() {
		this.module.layout.removeTab('notes');
	}
}

export default Notes;
