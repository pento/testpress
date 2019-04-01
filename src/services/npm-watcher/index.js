const { spawn } = require( 'child_process' );
const { mkdirSync, existsSync } = require( 'fs' );
const watch = require( 'nsfw' );
const { normalize } = require( 'path' );
const { addAction, doAction, didAction } = require( '@wordpress/hooks' );
const process = require( 'process' );
const debug = require( 'debug' )( 'testpress:services:npm-watcher' );

const { NPM_CACHE_DIR, NODE_BIN, NPM_BIN } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

const installProcesses = {
	'wordpress-folder': null,
	'gutenberg-folder': null,
};
let devProcess = null;
const cwds = {
	'wordpress-folder': '',
	'gutenberg-folder': '',
};

/**
 * Registers a watcher for when NPM needs to run on the WordPress install.
 */
function registerNPMJob() {
	debug( 'Registering job' );
	addAction( 'preference_saved', 'preferenceSaved', preferenceSaved, 10 );
	addAction( 'npm_install_finished', 'runNPMDev', runNPMDev );
	addAction( 'shutdown', 'shutdown', shutdown );

	Object.keys( cwds ).forEach( ( folderPref ) => {
		addAction( 'updated_node_and_npm', 'runNPMInstall', () => runNPMInstall( folderPref ) );

		cwds[ folderPref ] = preferences.value( 'basic', folderPref );
		if ( ! cwds[ folderPref ] ) {
			return;
		}

		const packageJson = normalize( cwds[ folderPref ] + '/package.json' );

		if ( existsSync( packageJson ) ) {
			debug( '(%s) Registering package.json watcher', folderPref );
			watch( packageJson, () => {
				debug( '(%s) package.json change detected', folderPref );
				runNPMInstall( folderPref );
			} )
				.then( ( watcher ) => watcher.start() );
		}
	} );
}

/**
 * If the WordPress folder is defined, run `npm install` in it.
 *
 * @param {string} folderPref The folder to run `npm install` on.
 */
function runNPMInstall( folderPref ) {
	debug( '(%s) Preparing for `npm install`', folderPref );
	if ( installProcesses[ folderPref ] ) {
		debug( '(%s) Ending previous `npm install` process', folderPref );
		installProcesses[ folderPref ].kill();
		installProcesses[ folderPref ] = null;
	}

	if ( ! didAction( 'updated_node_and_npm' ) ) {
		debug( "(%s) Bailing, node hasn't finished installing", folderPref );
		return;
	}

	if ( ! cwds[ folderPref ] ) {
		debug( "(%s) Bailing, folder isn't set", folderPref );
		return;
	}

	if ( ! existsSync( NPM_CACHE_DIR ) ) {
		debug( '(%s) Creating npm cache directory %s', folderPref, NPM_CACHE_DIR );
		mkdirSync( NPM_CACHE_DIR );
	}

	debug( '(%s) Starting `npm install`', folderPref );
	installProcesses[ folderPref ] = spawn( NODE_BIN, [
		NPM_BIN,
		'install',
		'--scripts-prepend-node-path=true',
	], {
		cwd: cwds[ folderPref ],
		encoding: 'utf8',
		env: {
			npm_config_cache: NPM_CACHE_DIR,
			PATH: process.env.PATH,
		},
	} );

	installProcesses[ folderPref ].stderr.on( 'data', ( data ) => {
		debug( '(%s) `npm install` error: %s', folderPref, data );
	} );

	installProcesses[ folderPref ].on( 'exit', ( code ) => {
		if ( 0 !== code ) {
			debug( '(%s) `npm install` finished with an error', folderPref );
			return;
		}
		debug( '(%s) `npm install` finished', folderPref );
		doAction( 'npm_install_finished', folderPref );
	} );
}

function runNPMDev( folderPref ) {
	if ( 'gutenberg-folder' !== folderPref ) {
		return;
	}

	debug( 'Preparing to run `npm run dev`' );

	if ( devProcess ) {
		debug( 'Ending previous `npm run dev` process' );
		devProcess.kill();
		devProcess = null;
	}

	if ( ! didAction( 'npm_install_finished' ) ) {
		debug( "Bailing, `npm install` isn't finished" );
		return;
	}

	if ( ! cwds[ 'gutenberg-folder' ] ) {
		debug( "Bailing, Gutenberg folder isn't set" );
		return;
	}

	debug( 'Starting `npm run dev`' );
	devProcess = spawn( NODE_BIN, [
		NPM_BIN,
		'run',
		'dev',
	], {
		cwd: cwds[ 'gutenberg-folder' ],
		encoding: 'utf8',
		env: {},
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
	if ( section !== 'basic' || ( preference !== 'wordpress-folder' && preference !== 'gutenberg-folder' ) ) {
		return;
	}

	if ( value === cwds[ preference ] ) {
		return;
	}

	debug( `${ preference } updated` );

	cwds[ preference ] = value;

	if ( 'gutenberg-folder' === preference && devProcess ) {
		devProcess.kill();
		devProcess = null;
	}

	runNPMInstall( preference );
}

/**
 * Shutdown handler, to ensure the Gutenberg watcher is stopped.
 */
function shutdown() {
	debug( 'Shutdown, stopping `npm run dev` process' );
	if ( devProcess ) {
		devProcess.kill();
		devProcess = null;
	}
}

module.exports = {
	registerNPMJob,
};
