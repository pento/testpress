const { app, ipcMain } = require( 'electron' );
const { doAction } = require( '@wordpress/hooks' );
const path = require( 'path' );
const debug = require( 'debug' )( 'wpde:preferences' );
const { existsSync, readFileSync, writeFileSync } = require( 'fs' );

class Preferences {
	constructor() {
		debug( 'Creating Preferences store' );
		this.dataStore = path.resolve( app.getPath( 'userData' ), 'preferences.json' );
		if ( ! existsSync( this.dataStore ) ) {
			writeFileSync( this.dataStore, '{}', {
					encoding: 'utf-8',
				}
			);
		}

		this.defaults = {
			basic: {
				'wordpress-folder': '',
			},
			site: {
				port: 9999,
			},
		};

		this.readPreferences();

		ipcMain.on( 'getPreferences', ( event ) => {
			debug( 'Sending preferences to render process' );
			event.returnValue = this.preferences;
		} );

		ipcMain.on( 'updatePreference', ( event, section, preference, value ) => {
			debug( 'Recieved updatePreference signal from render process' );
			this.update( section, preference, value );
		} );
	}

	/**
	 * Reads the preferences from the file they've been save to on disk.
	 */
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

	/**
	 * Writes the current preferences to disk.
	 */
	writePreferences() {
		debug( 'Writing preferences to disk' );
		writeFileSync( this.dataStore, JSON.stringify( this.preferences ), {
				encoding: 'utf-8',
			}
		);
	}

	/**
	 * Updates a preference value.
	 *
	 * @param {String} section    The preferences section to save the preference in.
	 * @param {String} preference The preference to save.
	 * @param {*}      value      The value of the preference.
	 */
	update( section, preference, value ) {
		debug( `Updated preference "${ section }.${ preference }" to "${ value }"`)
		this.preferences[ section ][ preference ]  = value;
		this.writePreferences();

		doAction( 'preference_saved', section, preference, value, this.preferences );
	}

	/**
	 * Get the value of a preference.
	 *
	 * @param {String} section    The preferences section that the preference is in.
	 * @param {String} preference The preference to retrieve.
	 *
	 * @returns The value of the preference.
	 */
	value( section, preference ) {
		return this.preferences[ section ][ preference ];
	}
};

debug( 'Initialising preferences' );
const preferences = new Preferences();

module.exports = {
	preferences,
};
