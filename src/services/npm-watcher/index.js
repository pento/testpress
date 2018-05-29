const { spawnSync } = require( 'child_process' );
const { mkdirSync, existsSync } = require( 'fs' );
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
}

/**
 * If the WordPress folder is defined, run `npm install` in it.
 */
function runNPMInstall() {
	const cwd = preferences.value( 'basic.wordpress-folder' );

	if ( ! cwd ) {
		return;
	}

	if ( ! existsSync( NPM_CACHE_DIR ) ) {
		mkdirSync( NPM_CACHE_DIR );
	}

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
}

module.exports = {
	registerNPMJob,
};
