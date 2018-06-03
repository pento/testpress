const { spawn } = require( 'child_process' );
const { existsSync } = require( 'fs' );
const { watch } = require( 'chokidar' );
const { addAction, doAction, didAction } = require( '@wordpress/hooks' );
const debug = require( 'debug' )( 'wpde:services:grunt' );
const { webContents } = require( 'electron' );
const { normalize } = require( 'path' );

const { TOOLS_DIR, NODE_BIN } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

let watchProcess = null;
let cwd = '';

let statusWindow = null;

/**
 * Registers a watcher for when Grunt needs to run on the WordPress install.
 */
function registerGruntJob( window ) {
	debug( 'Registering job' );
	statusWindow = window;
	addAction( 'npm_install_finished', 'runGruntWatch', runGruntWatch );
	addAction( 'preferences_saved', 'preferencesSaved', preferencesSaved, 9 );
	cwd = preferences.value( 'basic.wordpress-folder' );

	if ( ! cwd ) {
		return;
	}

	const gruntfileJs = normalize( cwd + '/Gruntfile.js' );

	if ( existsSync( gruntfileJs ) ) {
		debug( 'Registering Gruntfile.js watcher' );
		watch( gruntfileJs ).on( 'change', () => {
			debug( 'Gruntfile.js change detected' );
			runGruntWatch();
		 } );
	}

}

/**
 * If the WordPress folder is defined, run `grunt watch` on it.
 */
function runGruntWatch() {
	debug( 'Preparing to run `grunt watch`' );

	if ( watchProcess ) {
		debug( 'Ending previous `grunt watch` process' );
		watchProcess.kill();
		watchProcess = null;
	}

	if ( ! didAction( 'npm_install_finished' ) ) {
		debug( "Bailing, `npm install` isn't finished" );
		return;
	}

	if ( ! cwd ) {
		debug( "Bailing, WordPress folder isn't set" );
		return;
	}

	const grunt = cwd + '/node_modules/grunt/bin/grunt';
	let finishedFirstRun = false;

	debug( 'Starting `grunt watch`' );
	watchProcess = spawn( NODE_BIN, [
		grunt,
		'watch',
	], {
		cwd,
		env: {},
	} );


	watchProcess.stderr.on( 'data', ( data ) => debug( '`grunt warning` error: %s', data ) );
	watchProcess.stdout.on( 'data', ( data ) => {
		const waiting = data.toString().trim().endsWith( 'Waiting...' );

		if ( finishedFirstRun ) {
			if ( waiting ) {
				debug( 'Ready' );
				statusWindow.send( 'status', 'okay', 'Ready!' );
			} else {
				debug( 'Building...' );
				statusWindow.send( 'status', 'warning', 'Building...' );
			}
		} else if ( waiting ) {
			debug( 'Ready' );
			finishedFirstRun = true;
			doAction( 'grunt_watch_first_run_finished' );
		}

	} );
}

/**
 * Action handler for when preferences have been saved.
 *
 * @param {Object} newPreferences The new preferences that have just been saved.
 */
function preferencesSaved( newPreferences ) {
	if ( cwd === newPreferences.basic[ 'wordpress-folder' ] ) {
		return;
	}

	debug( 'WordPress folder updated' );

	cwd = newPreferences.basic[ 'wordpress-folder' ];

	if ( watchProcess ) {
		watchProcess.kill();
		watchProcess = null;
	}
}

module.exports = {
	registerGruntJob,
};
