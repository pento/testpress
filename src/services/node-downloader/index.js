const schedule = require( 'node-schedule' );
const compareVersions = require( 'compare-versions' );
const fetch = require( 'node-fetch' );
const { createWriteStream, createReadStream, mkdirSync, existsSync, readFileSync } = require( 'fs' );
const { app } = require( 'electron' );
const tar = require( 'tar' );
const { spawnSync } = require( 'child_process' );
const promisePipe = require( 'promisepipe' );
const hasha = require( 'hasha' );
const { TOOLS_DIR, ARCHIVE_DIR } = require( '../constants.js' );
const { doAction } = require( '@wordpress/hooks' );

const NODE_URL = 'https://nodejs.org/dist/latest-carbon/';
const PLATFORM = 'darwin-x64';
const VERSION_REGEX = new RegExp( `href="(node-v([0-9\\.]+)-${ PLATFORM }\\.tar\\.gz)`, 'g' );

const NODE_DIR = TOOLS_DIR + '/node';

const NODE_BIN = NODE_DIR + '/bin/node';
const NPM_BIN = NODE_DIR + '/bin/npm';

/**
 * Registers a check for new versions of Node every 12 hours.
 */
function registerNodeJob() {
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
	const currentVersion = getLocalVersion();
	const remoteVersion = await getRemoteVersion();

	if ( compareVersions( remoteVersion.version, currentVersion ) > 0 ) {
		const fileName = ARCHIVE_DIR + '/' + remoteVersion.filename;

		if ( ! await checksumLocalArchive( remoteVersion.filename ) ) {
			// Download
			const writeFile = createWriteStream(
				fileName, {
					encoding: 'binary',
				} );

			await fetch( NODE_URL + remoteVersion.filename )
				.then( ( res ) => promisePipe( res.body, writeFile ) );

			if ( ! await checksumLocalArchive( remoteVersion.filename ) ) {
				return false;
			}
		}

		if ( ! existsSync( NODE_DIR ) ) {
			mkdirSync( NODE_DIR );
		}

		// Install
		tar.extract( {
			file: fileName,
			cwd: NODE_DIR,
			strip: 1,
			sync: true,
			onwarn: ( msg ) => console.log( msg ),
		} );
	}

	updateNPM();

	doAction( 'updated_node_and_npm' );

	return true;
}

/**
 * Get the version of the local install of Node. If there isn't a copy of Node installed,
 * it returns a generic version number of '0.0.0', to ensure version comparisons will assume it's outdated.
 *
 * @return {String} The version number of the local copy of node.
 */
function getLocalVersion() {
	if ( ! existsSync( NODE_BIN ) ) {
		return '0.0.0';
	}

	const versionInfo = spawnSync( NODE_BIN, [ '-v' ] );

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
	const archiveFilename = ARCHIVE_DIR + '/' + filename;
	const checksumFilename = ARCHIVE_DIR + '/' + 'node-SHASUMS256.txt';

	if ( ! existsSync( archiveFilename ) ) {
		return false;
	}

	if ( ! existsSync( checksumFilename ) ) {
		const writeFile = createWriteStream( checksumFilename );

		await fetch( NODE_URL + 'SHASUMS256.txt' )
			.then( ( res ) => promisePipe( res.body, writeFile ) );
	}

	const localSum = hasha.fromFileSync( archiveFilename, { algorithm: 'sha256' } );
	const checksums = readFileSync( checksumFilename ).toString();

	return checksums.split( "\n" ).reduce( ( allowed, line ) => {
		const [ checksum, checkname ] = line.split( /\s+/ ).map( ( value ) => value.trim() );
		if ( checkname === filename && checksum === localSum ) {
			return true;
		}
		return allowed;
	}, false );
}

/**
 * Install the latest version of NPM in our local copy of Node.
 */
function updateNPM() {
	spawnSync( NODE_BIN, [
		NPM_BIN,
		'install',
		'-g',
		'npm',
	], {
		env: {},
	} );
}

module.exports = {
	registerNodeJob,
};
