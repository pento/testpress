const { app } = require( 'electron' );
const { doAction } = require( '@wordpress/hooks' );
const path = require( 'path' );
const debug = require( 'debug' )( 'wpde:preferences' );
const { readFileSync, writeFileSync } = require( 'fs' );

class Preferences {
	constructor() {
		debug( 'Creating Preferences store' );
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
		debug( 'Reading preferences from disk' );
		this.preferences = JSON.parse( readFileSync( this.dataStore, {
			encoding: 'utf-8',
		} ) );

		Object.keys( this.defaults ).forEach( ( section ) => {
			if ( ! this.preferences[ section ] ) {
				debug( `Creating missing preferences section "${ section }"` )
				this.preferences[ section ] = {};
			}

			Object.keys( this.defaults[ section ] ).forEach( ( pref ) => {
				if ( ! this.preferences[ section ][ pref ] ) {
					debug( `Adding missing preference "${ section }.${ pref }"` );
					this.preferences[ section ][ pref ] = this.defaults[ section ][ pref ];
				}
			} );
		} );

		this.writePreferences();
	}

	writePreferences() {
		debug( 'Writing preferences to disk' );
		writeFileSync( this.dataStore, JSON.stringify( this.preferences ), {
				encoding: 'utf-8',
			}
		);
	}

	updatePreference( section, preference, value ) {
		debug( `Updated preference "${ section }.${ preference }" to "${ value }"`)
		this.preferences[ section ][ preference ]  = value;
		this.writePreferences();

		doAction( 'preference_saved', section, preference, value, this.preferences );
	}

	value( section, preference ) {
		return this.preferences[ section ][ preference ];
	}
};

debug( 'Initialising preferences' );
const preferences = new Preferences();

module.exports = {
	preferences,
};
