const schedule = require( 'node-schedule' );
const compareVersions = require( 'compare-versions' );
const { tmpdir } = require( 'os' );
const fetch = require( 'node-fetch' );
const { createWriteStream, createReadStream, mkdirSync, existsSync } = require( 'fs' );
const { app } = require( 'electron' );
const tar = require( 'tar' );
const { spawnSync } = require( 'child_process' );
const promisePipe = require( 'promisepipe' );

const NODE_URL = 'https://nodejs.org/dist/latest-carbon/';
const PLATFORM = 'darwin-x64';
const VERSION_REGEX = new RegExp( `href="(node-v([0-9\\.]+)-${ PLATFORM }\\.tar\\.gz)`, 'g' );

const NODE_DIR = app.getPath( 'userData' ) + '/tools/node';
const NODE_BIN = NODE_DIR + '/bin/node';

function registerJob() {
	const rule = new schedule.RecurrenceRule();
	rule.hour = [ 7, 19 ];
	rule.minute = 0;

	schedule.scheduleJob( rule, checkAndInstallUpdates );
	checkAndInstallUpdates();
}

async function checkAndInstallUpdates() {
	const currentVersion = getLocalVersion();
	const remoteVersion = await getRemoteVersion();

	if ( compareVersions( remoteVersion.version, currentVersion ) > 0 ) {
		const fileName = tmpdir() + '/' + remoteVersion.filename;

		// Download
		const writeFile = createWriteStream(
			fileName, {
				encoding: 'binary',
			} );
		await fetch( NODE_URL + remoteVersion.filename )
			.then( ( res ) => promisePipe( res.body, writeFile ) );

		if ( ! existsSync( NODE_DIR ) ) {
			mkdirSync( NODE_DIR );
		}

		// Install
		tar.extract( {
			file: fileName,
			cwd: NODE_DIR,
			strip: 1,
			onwarn: ( msg ) => console.log( msg ),
		} );
	}
}

function getLocalVersion() {
	if ( ! existsSync( NODE_BIN ) ) {
		return '0.0.0';
	}

	const versionInfo = spawnSync( NODE_BIN, [ '-v' ] );

	return versionInfo.stdout.toString().replace( 'v', '' );
}

async function getRemoteVersion() {
	const remotels = await fetch( NODE_URL )
		.then ( ( res ) => res.text() );

	const versionInfo = VERSION_REGEX.exec( remotels );

	return {
		version: versionInfo[ 2 ],
		filename: versionInfo[ 1 ],
	};
}

module.exports = {
	registerNodeJob: registerJob,
};
