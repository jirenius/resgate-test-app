import { AppExt } from 'modapp/ext';
import eventBus from 'modapp/eventBus';
import modules from './modules';
import config from './module.config';

// Create app and load core modules
window.app = new AppExt(config, { eventBus: eventBus });
window.app.loadBundle(modules)
	.then(result => {
		console.log("[Main] Loaded modules: ", result);
		window.app.render(document.body);
	});
