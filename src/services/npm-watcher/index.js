const { spawnSync } = require( 'child_process' );
const { mkdirSync, existsSync } = require( 'fs' );
const { watch } = require( 'chokidar' );
const { addAction } = require( '@wordpress/hooks' );
const { app } = require( 'electron' );
const process = require( 'process' );

const { TOOLS_DIR, ARCHIVE_DIR } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

const NODE_DIR = TOOLS_DIR + '/node';
const NPM_CACHE_DIR = ARCHIVE_DIR + '/npm-cache';

const NODE_BIN = NODE_DIR + '/bin/node';
const NPM_BIN = NODE_DIR + '/bin/npm';

/**
 * Registers a watcher for when NPM needs to run on the WordPress install.
 */
function registerNPMJob() {
	addAction( 'updated_node_and_npm', 'runNPMInstall', runNPMInstall );

	const packageJson = preferences.value( 'basic.wordpress-folder' ) + '/package.json';
	console.log( packageJson );
	if ( existsSync( packageJson ) ) {
		console.log( 'exists' );
		watch( packageJson ).on( 'all', runNPMInstall );
	}
}

/**
 * If the WordPress folder is defined, run `npm install` in it.
 */
function runNPMInstall() {
	const cwd = preferences.value( 'basic.wordpress-folder' );
	console.log(1);

	if ( ! cwd ) {
		return;
	}
	console.log(2);
	if ( ! existsSync( NPM_CACHE_DIR ) ) {
		mkdirSync( NPM_CACHE_DIR );
	}
	console.log(3);
	spawnSync( NODE_BIN, [
		NPM_BIN,
		'install',
	], {
		cwd,
		env: {
			npm_config_cache: NPM_CACHE_DIR,
			PATH: process.env.PATH,
		},
	} );
	console.log(4);
}

module.exports = {
	registerNPMJob,
};
