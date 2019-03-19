const { ipcMain } = require( 'electron' );
const { spawn } = require( 'child_process' );
const { existsSync } = require( 'fs' );
const { watch } = require( 'chokidar' );
const { addAction, doAction, didAction } = require( '@wordpress/hooks' );
const debug = require( 'debug' )( 'testpress:services:grunt' );
const { normalize } = require( 'path' );
const { createServer } = require( 'http' );
const { createReadStream } = require( 'fs' );

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

	createServer( patchListener ).listen( 21853 );

	ipcMain.on( 'applyPatch', ( event, patchLocation ) => {
		runGruntPatch( patchLocation );
	} );

	ipcMain.on( 'uploadPatch', ( event, ticket, username, password ) => {
		runGruntUploadPatch( ticket, username, password );
	} );

	cwd = preferences.value( 'basic', 'wordpress-folder' );

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
 * Event handler for when data is received on the HTTP server.
 *
 * @param {IncomingMessage} request  The request handler created by the server.
 * @param {ServerResponse}  response The response handler, for sending data back to the client.
 */
function patchListener( request, response ) {
	debug( 'Received a HTTP request for %s.', request.url );

	switch ( request.url ) {
		case '/testpress.user.js':
			response.writeHead( 200, { 'Content-Type': 'text/javascript' } );
			createReadStream( __dirname + '/testpress.user.js' ).pipe( response );

			break;

		case '/patch':
			const chunks = [];
			request.on( 'data', ( chunk ) => chunks.push( chunk ) );
			request.on( 'end', () => {
				const data = JSON.parse( Buffer.concat( chunks ).toString() );
				const { ticket, filename } = data;
				debug( 'HTTP data: %o', data );

				response.writeHead( 200, { 'Content-Type': 'text/json' } );

				if ( ! ticket || ticket.match( /[^0-9]/ ) || ! filename || filename.includes( '/' ) ) {
					response.write( JSON.stringify( { success: false } ) );
					response.end();
					return;
				}

				runGruntPatch( `https://core.trac.wordpress.org/attachment/ticket/${ ticket }/${ filename }` );

				response.write( JSON.stringify( { success: true } ) );
				response.end();
			} );

			break;
	}
}

/**
 * Runs the `grunt patch` command with the patch from the ticket passed.
 *
 * @param {string} url The URL of the patch being applied.
 */
function runGruntPatch( url ) {
	if ( ! cwd ) {
		return;
	}

	const grunt = cwd + '/node_modules/grunt/bin/grunt';

	debug( 'Starting `grunt patch`' );
	const patchProcess = spawn( NODE_BIN, [
		grunt,
		`patch:${ url }`,
	], {
		cwd,
		encoding: 'utf8',
		env: {},
	} );

	patchProcess.stderr.on( 'data', ( data ) => debug( '`grunt patch` error: %s', data ) );
	patchProcess.stdout.on( 'data', ( data ) => debug( '`grunt patch` output: %s', data ) );
}

/**
 * Upload a patch to the specified ticket, using the passed credentials.
 *
 * @param {number} ticket   Ticket number.
 * @param {string} username WordPress.org username.
 * @param {string} password WordPress.org password.
 */
function runGruntUploadPatch( ticket, username, password ) {
	if ( ! cwd ) {
		return;
	}

	const grunt = cwd + '/node_modules/grunt/bin/grunt';

	debug( 'Starting `grunt upload_patch`' );
	const patchProcess = spawn( NODE_BIN, [
		grunt,
		`upload_patch:${ ticket }`,
	], {
		cwd,
		encoding: 'utf8',
		env: {
			WPORG_USERNAME: username,
			WPORG_PASSWORD: password,
		},
	} );

	patchProcess.stderr.on( 'data', ( data ) => debug( '`grunt upload_patch` error: %s', data ) );
	patchProcess.stdout.on( 'data', ( data ) => debug( '`grunt upload_patch` output: %s', data ) );
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
