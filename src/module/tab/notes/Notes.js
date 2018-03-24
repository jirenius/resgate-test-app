
import Elem from 'modapp-base-component/Elem';
import Html from 'modapp-base-component/Html';
import l10n from 'modapp-l10n';
import NotesComponent from './NotesComponent';
import './Notes.css';

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
			name: l10n.l('notes.notes', `Notes`),
			sortOrder: 30,
			componentFactory: () => new Elem(n =>
				n.elem('div', { className: 'module-notes' }, [
					n.component(new Html(l10n.l('notes.description',
						`<p>Make different selection on how you wish to view the collection of notes, changing the query parameters to modify the selection. Every other second, the last item in the <em>notesService.notes</em> collection will be removed and directly added to the beginning.</p>
						<p>Used for testing collections, add/remove events, resource queries, query events, and model caching for overlapping collections.</p>`
					), { tagName: 'div' })),
					n.elem('hr'),
					n.elem('div', { className: 'module-notes--row' }, [
						n.component(new NotesComponent(this.module, { state: 'all' })),
						n.component(new NotesComponent(this.module, { state: 'query' })),
						n.component(new NotesComponent(this.module, { state: 'none' })),
					])
				])
			)
		});
	}

	dispose() {
		this.module.layout.removeTab('notes');
	}
}

export default Notes;
