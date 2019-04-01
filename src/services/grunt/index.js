const { spawn } = require( 'child_process' );
const { existsSync } = require( 'fs' );
const watch = require( 'nsfw' );
const { addAction, doAction, didAction } = require( '@wordpress/hooks' );
const debug = require( 'debug' )( 'testpress:services:grunt' );
const { normalize } = require( 'path' );

const { NODE_BIN } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );
const { setStatus } = require( '../../utils/status' );

let watchProcess = null;
let cwd = '';

/**
 * Registers a watcher for when Grunt needs to run on the WordPress install.
 */
function registerGruntJob() {
	debug( 'Registering job' );

	addAction( 'npm_install_finished', 'runGruntWatch', runGruntWatch );
	addAction( 'preference_saved', 'preferenceSaved', preferenceSaved, 9 );
	addAction( 'shutdown', 'shutdown', shutdown );

	cwd = preferences.value( 'basic', 'wordpress-folder' );

	if ( ! cwd ) {
		return;
	}

	const gruntfileJs = normalize( cwd + '/Gruntfile.js' );

	if ( existsSync( gruntfileJs ) ) {
		debug( 'Registering Gruntfile.js watcher' );
		watch( gruntfileJs, () => {
			debug( 'Gruntfile.js change detected' );
			runGruntWatch();
		} )
			.then( ( watcher ) => watcher.start() );
	}
}

/**
 * If the WordPress folder is defined, run `grunt watch` on it.
 *
 * @param {string=} folderPref The folder preference to try and watch.
 */
function runGruntWatch( folderPref = '' ) {
	// We only need to run `grunt watch` on WordPress folder updates.
	if ( folderPref && 'wordpress-folder' !== folderPref ) {
		return;
	}

	setStatus( 'grunt', 'building' );

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

	debug( 'Starting `grunt watch`' );
	watchProcess = spawn( NODE_BIN, [
		grunt,
		'watch',
		'--dev',
	], {
		cwd,
		encoding: 'utf8',
		env: {},
	} );

	let finishedFirstRun = false;
	let showedBuilding = true;

	watchProcess.stderr.on( 'data', ( data ) => debug( '`grunt warning` error: %s', data ) );
	watchProcess.stdout.on( 'data', ( data ) => {
		const waiting = data.toString().trim().endsWith( 'Waiting...' );

		if ( finishedFirstRun ) {
			if ( waiting ) {
				showedBuilding = false;
				setStatus( 'grunt', 'ready' );
				debug( 'Ready' );
			} else if ( ! showedBuilding ) {
				showedBuilding = true;
				setStatus( 'grunt', 'rebuilding' );
				debug( 'Building...' );
			}
		} else if ( waiting ) {
			setStatus( 'grunt', 'ready' );
			debug( 'Ready' );
			finishedFirstRun = true;
			showedBuilding = true;
			doAction( 'grunt_watch_first_run_finished' );
		}
	} );
}

/**
 * Action handler for when preferences have been saved.
 *
 * @param {string} section    The preferences section that the saved preference is in.
 * @param {string} preference The preferences that has been saved.
 * @param {*}      value      The value that the preference has been changed to.
 */
function preferenceSaved( section, preference, value ) {
	if ( section !== 'basic' || preference !== 'wordpress-folder' ) {
		return;
	}

	if ( value === cwd ) {
		return;
	}

	debug( 'WordPress folder updated' );

	cwd = value;

	if ( watchProcess ) {
		watchProcess.kill();
		watchProcess = null;
	}
}

/**
 * Shutdown handler, to ensure the grunt watcher is stopped.
 */
function shutdown() {
	debug( 'Shutdown, stopping `grunt watch` process' );
	if ( watchProcess ) {
		watchProcess.kill();
		watchProcess = null;
	}
}

module.exports = {
	registerGruntJob,
};
