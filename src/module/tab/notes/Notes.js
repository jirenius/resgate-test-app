import Model from 'modapp-resource/Model';
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

		this.models = [
			new Model({
				data: {
					state: 'all',
					start: '0',
					limit: '5'
				}
			}),
			new Model({
				data: {
					state: 'query',
					start: '0',
					limit: '5'
				}
			}),
			new Model({
				data: {
					state: 'none',
					start: '5',
					limit: '5'
				}
			})
		];

		this.module.layout.addTab({
			id: 'notes',
			name: l10n.l('notes.notes', `Notes`),
			sortOrder: 30,
			componentFactory: () => new Elem(n =>
				n.elem('div', { className: 'module-notes' }, [
					n.component(new Html(l10n.l('notes.description',
						`<p>Fetch separate collections from <em>notesService</em>, changing the query parameters to modify the selection. Every other second, the last item in the <em>notesService.notes</em> collection will be removed and directly added to the beginning.</p>
						<p>Used for testing collections, add/remove events, resource queries, query events, and model caching for overlapping collections.</p>`
					), { tagName: 'div' })),
					n.elem('div', [
						n.text('Web resource: '),
						n.elem('a', { attributes: {
							href: this.module.api.getWebResourceUri('notesService.notes'),
							target: '_blank'
						}}, [
							n.text(this.module.api.getWebResourceUri('notesService.notes'))
						])
					]),
					n.elem('div', [
						n.text('Query resource: '),
						n.elem('a', { attributes: {
							href: this.module.api.getWebResourceUri('notesService.notes?start=0&limit=5'),
							target: '_blank'
						}}, [
							n.text(this.module.api.getWebResourceUri('notesService.notes?start=0&limit=5'))
						])
					]),
					n.elem('hr'),
					n.elem('div', { className: 'module-notes--row' }, this._getNotesComponents(n))
				])
			)
		});
	}

	_getNotesComponents(n) {
		return this.models.map(m => n.component(new NotesComponent(this.module, m)));
	}

	dispose() {
		this.module.layout.removeTab('notes');
	}
}

export default Notes;
