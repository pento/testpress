const { app } = require( 'electron' );
const { doAction } = require( '@wordpress/hooks' );
const path = require( 'path' );
const debug = require( 'debug' )( 'wpde:preferences' );
const ElectronPreferences = require( 'electron-preferences' );

debug( 'Initialising preferences' );
const preferences = new ElectronPreferences( {
	dataStore: path.resolve( app.getPath( 'userData' ), 'preferences.json' ),
	defaults: {
		basic: {
			'wordpress-folder': '',
		},
		site: {
			port: 9999,
		},
	},
	sections: [ {
		id: 'basic',
		label: 'Basic',
		icon: 'folder-15',
		form: {
			groups: [ {
				label: 'WordPress',
				fields: [ {
					label: 'WordPress Folder',
					key: 'wordpress-folder',
					type: 'directory',
					help: 'The location where your WordPress repo is stored.'
				} ],
			} ],
		},
	}, {
		id: 'site',
		label: 'Site',
		icon: 'cloud-26',
		form: {
			groups: [ {
				label: 'Site',
				fields: [ {
					label: 'Port Number',
					key: 'port',
					type: 'text',
					inputType: 'number',
					help: 'The port to run your development site on.'
				} ],
			} ],
		},
	} ],
} );

preferences.on( 'save', ( preferences ) => {
	debug( 'Preferences saved' );
	doAction( 'preferences_saved', preferences );
} );

module.exports = {
	preferences,
};
