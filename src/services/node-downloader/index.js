const schedule = require( 'node-schedule' );
const compareVersions = require( 'compare-versions' );
const fetch = require( 'node-fetch' );
const { createWriteStream, createReadStream, mkdirSync, existsSync, readFileSync, unlinkSync } = require( 'fs' );
const { app } = require( 'electron' );
const { normalize } = require( 'path' );
const tar = require( 'tar' );
const { spawnSync } = require( 'child_process' );
const { spawn } = require( 'promisify-child-process' );
const { promisify } = require( 'util' );
const promisePipe = require( 'promisepipe' );
const hasha = require( 'hasha' );
const { TOOLS_DIR, ARCHIVE_DIR, NODE_DIR, NODE_BIN, NPM_BIN } = require( '../constants.js' );
const { doAction } = require( '@wordpress/hooks' );
const debug = require( 'debug' )( 'wpde:services:node-downloader' );
const DecompressZip = require( 'decompress-zip' );

const NODE_URL = 'https://nodejs.org/dist/latest-carbon/';

const PLATFORM = ( 'win32' === process.platform ) ? 'win' : process.platform;
const ARCH = ( 'x32' === process.arch ) ? 'x86' : process.arch;
const ZIP = ( 'win32' === process.platform ) ? 'zip' : 'tar.gz';

const VERSION_REGEX = new RegExp( `href="(node-v([0-9\\.]+)-${ PLATFORM }-${ ARCH }\\.${ ZIP })`, 'g' );

/**
 * Registers a check for new versions of Node every 12 hours.
 */
function registerNodeJob() {
	debug( 'Registering job' );
	const rule = new schedule.RecurrenceRule();
	rule.hour = [ 7, 19 ];
	rule.minute = 0;

	schedule.scheduleJob( rule, checkAndInstallUpdates );
	checkAndInstallUpdates();
}

/**
 * Checks for a new version of Node, and installs it if needed.
 *
 * @return {Boolean} false if the download failed.
 */
async function checkAndInstallUpdates() {
	debug( 'Checking for updates' );
	const currentVersion = await getLocalVersion();
	const remoteVersion = await getRemoteVersion();

	debug( 'Installed version: %s, remote version: %s', currentVersion, remoteVersion.version );

	if ( compareVersions( remoteVersion.version, currentVersion ) > 0 ) {
		debug( 'Newer version found, starting install...' );
		const filename = normalize( ARCHIVE_DIR + '/' + remoteVersion.filename );

		if ( ! await checksumLocalArchive( remoteVersion.filename ) ) {
			const url = NODE_URL + remoteVersion.filename;

			debug( 'Downloading from %s', url );

			const writeFile = createWriteStream(
				filename, {
					encoding: 'binary',
				} );

			await fetch( url )
				.then( ( res ) => promisePipe( res.body, writeFile ) );

			debug( 'Finished downloading' );

			if ( ! await checksumLocalArchive( remoteVersion.filename ) ) {
				debug( 'Checksum failed, bailing before install' );
				return false;
			}
		}

		if ( ! existsSync( NODE_DIR ) ) {
			debug( 'Creating node directory %s', NODE_DIR );
			mkdirSync( NODE_DIR );
		}

		debug( 'Extracting new version from %s to %s', filename, NODE_DIR );

		if ( 'win32' === process.platform ) {
			unzipper = new DecompressZip( filename );

			await new Promise( ( resolve, reject ) => {
				unzipper.on( 'extract', resolve );
				unzipper.on( 'error', reject );

				unzipper.extract( {
					path: NODE_DIR,
					strip: 1,
					filter: ( file ) => file.type !== 'Directory',
				} );
			} )
		} else {
			await tar.extract( {
				file: filename,
				cwd: NODE_DIR,
				strip: 1,
				onwarn: ( msg ) => console.log( msg ),
			} );
		}
	}

	updateNPM();

	return true;
}

/**
 * Get the version of the local install of Node. If there isn't a copy of Node installed,
 * it returns a generic version number of '0.0.0', to ensure version comparisons will assume it's outdated.
 *
 * @return {String} The version number of the local copy of node.
 */
async function getLocalVersion() {
	if ( ! existsSync( NODE_BIN ) ) {
		return '0.0.0';
	}

	const versionInfo = await spawn( NODE_BIN, [ '-v' ] );

	return versionInfo.stdout.toString().replace( 'v', '' ).trim();
}

/**
 * Retrieves the version (and filename) of the latest remote version of Node.
 *
 * @return {Object} Object containing the `version` and `filename`.
 */
async function getRemoteVersion() {
	const remotels = await fetch( NODE_URL )
		.then ( ( res ) => res.text() );

	const versionInfo = VERSION_REGEX.exec( remotels );

	if ( ! versionInfo ) {
		debug( "Remote version regex (%s) failed on html:\n%s\n%O", VERSION_REGEX, remotels, versionInfo );
		return {
			version: '0.0.0',
			filename: '',
		};
	}

	return {
		version: versionInfo[ 2 ],
		filename: versionInfo[ 1 ],
	};
}

/**
 * Checksums the local copy of the Node archive against the official checksums.
 *
 * @param {String} filename The filename to be using for checks.
 *
 * @return {Boolean} True if the checksum matches, false if it doesn't.
 */
async function checksumLocalArchive( filename ) {
	const archiveFilename = normalize( ARCHIVE_DIR + '/' + filename );
	const checksumFilename = normalize( ARCHIVE_DIR + '/' + 'node-SHASUMS256.txt' );

	if ( ! existsSync( archiveFilename ) ) {
		debug( "Checksum file doesn't exist" );
		return false;
	}

	if ( ! existsSync( checksumFilename ) ) {
		debug( 'Downloading latest checksum file' );
		const writeFile = createWriteStream( checksumFilename );

		await fetch( NODE_URL + 'SHASUMS256.txt' )
			.then( ( res ) => promisePipe( res.body, writeFile ) );
	}

	debug( 'Checking checksum of the local archive against checksum file' );
	const localSum = hasha.fromFileSync( archiveFilename, { algorithm: 'sha256' } );
	const checksums = readFileSync( checksumFilename ).toString();

	const passed = checksums.split( "\n" ).reduce( ( allowed, line ) => {
		const [ checksum, checkname ] = line.split( /\s+/ ).map( ( value ) => value.trim() );
		if ( checkname === filename && checksum === localSum ) {
			return true;
		}
		return allowed;
	}, false );

	if ( passed ) {
		debug( 'Checksum passed' );
	} else {
		debug( 'Checksum failed' );
	}

	return passed;
}

/**
 * Install the latest version of NPM in our local copy of Node.
 */
async function updateNPM() {
	debug( 'Preparing to update npm' );
	if ( ! existsSync( NODE_BIN ) ) {
		debug( "Bailing, couldn't find node binary" );
		return;
	}

	const npmIsUpdated = await spawn( NODE_BIN, [
		NPM_BIN,
		'outdated',
		'-g',
		'npm',
	], {
		env: {},
	} ).then( () => true ).catch( () => false );

	if ( npmIsUpdated ) {
		debug( 'npm running latest version' );
		doAction( 'updated_node_and_npm' );
		return;
	}

	const requiredPackages = [ 'npm' ];

	if ( 'win32' === process.platform ) {
		debug( 'Deleting npm files' );
		// Windows needs these files removed before NPM will update.
		[ 'npm', 'npm.cmd', 'npx', 'npx.cmd' ].forEach( ( file ) => {
			const path = normalize( NODE_DIR + '/' + file );
			try {
				unlinkSync( path );
			} catch ( error ) {}
		} );

		// Windows can't deal with long file paths, so needs to be flattened.
		requiredPackages.push( 'flatten-packages' );
	}

	debug( 'Starting npm update' );
	await spawn( NODE_BIN, [
		NPM_BIN,
		'install',
		'-g',
		...requiredPackages,
	], {
		env: {},
	} );

	debug( 'npm updated' );
	
	if ( 'win32' === process.platform ) {
		debug( 'Flattening node packages' );

		await spawn( NODE_BIN, [
			normalize( NODE_DIR + '/node_modules/flatten-packages/bin/flatten' ),
		], {
			cwd: NODE_DIR,
			env: {},
		} );	

		debug( 'Packages flattened' );
	}

	doAction( 'updated_node_and_npm' );
}

module.exports = {
	registerNodeJob,
};
