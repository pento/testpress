const { app } = require( 'electron' );

const path = require( 'path' );

const ElectronPreferences = require( 'electron-preferences' );

const preferences = new ElectronPreferences( {
	dataStore: path.resolve( app.getPath( 'userData' ), 'preferences.json' ),
	defaults: {
		basic: {
			'wordpress-folder': '',
		},
	},
	sections: [ {
		id: 'basic',
		label: 'Basic Settings',
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
	} ],
} );

module.exports = {
	preferences,
};
