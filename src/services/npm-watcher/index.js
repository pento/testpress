const { spawn } = require( 'child_process' );
const { mkdirSync, existsSync } = require( 'fs' );
const { watch } = require( 'chokidar' );
const { normalize } = require( 'path' );
const { addAction, doAction } = require( '@wordpress/hooks' );
const process = require( 'process' );
const debug = require( 'debug' )( 'wpde:services:npm-watcher' );

const { TOOLS_DIR, NPM_CACHE_DIR, NODE_BIN, NPM_BIN } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

let installProcess = null;
let cwd = '';

/**
 * Registers a watcher for when NPM needs to run on the WordPress install.
 */
function registerNPMJob() {
	debug( 'Registering job' );
	addAction( 'updated_node_and_npm', 'runNPMInstall', runNPMInstall );
	addAction( 'preferences_saved', 'preferencesSaved', preferencesSaved, 10 );

	cwd = preferences.value( 'basic.wordpress-folder' );
	if ( ! cwd ) {
		return;
	}

	const packageJson = normalize( cwd + '/package.json' );

	if ( existsSync( packageJson ) ) {
		debug( 'Registering package.json watcher' );
		watch( packageJson ).on( 'change', () => {
			debug( 'package.json change detected' );
			runNPMInstall();
		 } );
	}
}

/**
 * If the WordPress folder is defined, run `npm install` in it.
 */
function runNPMInstall() {
	debug( 'Preparing for `npm install`' );
	if ( installProcess ) {
		debug( 'Ending previous `npm install` process' );
		installProcess.kill();
		installProcess = null;
	}

	if ( ! cwd ) {
		debug( "Bailing, WordPress folder isn't set" );
		return;
	}

	if ( ! existsSync( NPM_CACHE_DIR ) ) {
		debug( 'Creating npm cache directory %s', NPM_CACHE_DIR );
		mkdirSync( NPM_CACHE_DIR );
	}

	debug( 'Starting `npm install`' );
	installProcess = spawn( NODE_BIN, [
		NPM_BIN,
		'install',
		'--scripts-prepend-node-path=true'
	], {
		cwd,
		env: {
			npm_config_cache: NPM_CACHE_DIR,
			PATH: process.env.PATH,
		},
	} );

	installProcess.stderr.on( 'data', ( data ) => debug( '`npm install` error: %s', data ) );

	installProcess.on( 'exit', ( code ) => {
		if ( 0 !== code ) {
			debug( '`npm install` finished with an error' );
			return;
		}
		debug( '`npm install` finished' );
		doAction( 'npm_install_finished' );
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

	runNPMInstall();
}

module.exports = {
	registerNPMJob,
};
