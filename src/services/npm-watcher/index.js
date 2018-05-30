const { spawn } = require( 'child_process' );
const { mkdirSync, existsSync } = require( 'fs' );
const { watch } = require( 'chokidar' );
const { addAction, doAction } = require( '@wordpress/hooks' );
const process = require( 'process' );

const { TOOLS_DIR, ARCHIVE_DIR } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

const NODE_DIR = TOOLS_DIR + '/node';
const NPM_CACHE_DIR = ARCHIVE_DIR + '/npm-cache';

const NODE_BIN = NODE_DIR + '/bin/node';
const NPM_BIN = NODE_DIR + '/bin/npm';

let installProcess = null;
let cwd = '';

/**
 * Registers a watcher for when NPM needs to run on the WordPress install.
 */
function registerNPMJob() {
	addAction( 'updated_node_and_npm', 'runNPMInstall', runNPMInstall );
	addAction( 'preferences_saved', 'preferencesSaved', preferencesSaved, 10 );

	cwd = preferences.value( 'basic.wordpress-folder' );
	if ( ! cwd ) {
		return;
	}

	const packageJson = cwd + '/package.json';

	if ( existsSync( packageJson ) ) {
		watch( packageJson ).on( 'all', runNPMInstall );
	}
}

/**
 * If the WordPress folder is defined, run `npm install` in it.
 */
function runNPMInstall() {
	if ( installProcess ) {
		installProcess.kill();
		installProcess = null;
	}

	if ( ! cwd ) {
		return;
	}

	if ( ! existsSync( NPM_CACHE_DIR ) ) {
		mkdirSync( NPM_CACHE_DIR );
	}

	installProcess = spawn( NODE_BIN, [
		NPM_BIN,
		'install',
	], {
		cwd,
		env: {
			npm_config_cache: NPM_CACHE_DIR,
			PATH: process.env.PATH,
		},
	} );

	installProcess.on( 'close', ( code ) => {
		if ( 0 !== code ) {
			return;
		}
		doAction( 'npm_install_finished' );
	} );
}

function preferencesSaved( newPreferences ) {
	if ( cwd === newPreferences.basic[ 'wordpress-folder' ] ) {
		return;
	}

	cwd = newPreferences.basic[ 'wordpress-folder' ];

	runNPMInstall();
}

module.exports = {
	registerNPMJob,
};
