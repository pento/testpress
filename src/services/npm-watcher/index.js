const { spawn } = require( 'child_process' );
const { mkdirSync, existsSync } = require( 'fs' );
const { watch } = require( 'chokidar' );
const { normalize } = require( 'path' );
const { addAction, doAction, didAction } = require( '@wordpress/hooks' );
const process = require( 'process' );
const debug = require( 'debug' )( 'testpress:services:npm-watcher' );

const { NPM_CACHE_DIR, NODE_BIN, NPM_BIN } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

let installProcess = null;
let cwd = '';

/**
 * Registers a watcher for when NPM needs to run on the WordPress install.
 */
function registerNPMJob() {
	debug( 'Registering job' );
	addAction( 'updated_node_and_npm', 'runNPMInstall', runNPMInstall );
	addAction( 'preference_saved', 'preferenceSaved', preferenceSaved, 10 );

	cwd = preferences.value( 'basic', 'wordpress-folder' );
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

	if ( ! didAction( 'updated_node_and_npm' ) ) {
		debug( "Bailing, node hasn't finished installing" );
		return;
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
 * @param {String} section    The preferences section that the saved preference is in.
 * @param {String} preference The preferences that has been saved.
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

	runNPMInstall();
}

module.exports = {
	registerNPMJob,
};
