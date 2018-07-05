const { app } = require( 'electron' );
const { doAction } = require( '@wordpress/hooks' );
const path = require( 'path' );
const debug = require( 'debug' )( 'wpde:preferences' );
const { readFileSync, writeFileSync } = require( 'fs' );

debug( 'Initialising preferences' );
class Preferences {
	constructor() {
		this.dataStore = path.resolve( app.getPath( 'userData' ), 'preferences.json' ),

		this.defaults = {
			basic: {
				'wordpress-folder': '',
			},
			site: {
				port: 9999,
			},
		};

		this.readPreferences();
	}

	readPreferences() {
		this.preferences = JSON.parse( readFileSync( this.dataStore, {
			encoding: 'utf-8',
		} ) );

		this.defaults.forEach( ( prefs, section ) => {
			if ( ! this.preferences[ section ] ) {
				this.preferences.section = {};
			}

			prefs.forEach( ( val, pref ) => {
				if ( ! this.preferences[ section ][ pref ] ) {
					this.preferences[ section ][ pref ] = val;
				}
			} );
		} );

		this.writePreferences();
	}

	writePreferences() {
		writeFileSync( this.dataStore, JSON.stringify( this.preferences ), {
				encoding: 'utf-8',
			}
		);
	}
};



// preferences.on( 'save', ( preferences ) => {
// 	debug( 'Preferences saved' );
// 	doAction( 'preferences_saved', preferences );
// } );

module.exports = {
	Preferences,
};
