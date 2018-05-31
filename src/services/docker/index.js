const yaml = require( 'node-yaml' );
const { copyFileSync, existsSync, renameSync } = require( 'fs' );
const { spawnSync } = require( 'child_process' );
const { spawn } = require( 'promisify-child-process' );
const process = require( 'process' );
const { addAction, didAction } = require( '@wordpress/hooks' );
const sleep = require( 'system-sleep' );
const debug = require( 'debug' )( 'wpde:services:docker' );
const { webContents } = require( 'electron' );

const { TOOLS_DIR } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

let cwd = '';
let port = 9999;

let statusWindow = null;

/**
 * Registers the Docker actions, then starts Docker.
 */
function registerDockerJob( window ) {
	debug( 'Registering job' );
	statusWindow = window;
	addAction( 'preferences_saved', 'preferencesSaved', preferencesSaved, 9 );
	addAction( 'shutdown', 'shutdown', shutdown );
	startDocker();
}

/**
 * Get docker up and running.
 */
async function startDocker() {
	debug( 'Preparing to start Docker' );
	cwd = preferences.value( 'basic.wordpress-folder' );
	port = preferences.value( 'site.port' ) || 9999;

	if ( ! cwd || ! port ) {
		debug( 'Bailing, preferences not set' );
		return;
	}

	const defaultOptions = {
		version: '3',
		services: {
			'wordpress-develop': {
				build: {
					context: '.',
					dockerfile: 'Dockerfile',
				},
				ports: [
					port + ':80',
				],
				volumes: [
					cwd + ':/var/www/html',
				],
			},
			cli: {
				image: 'wordpress:cli',
				volumes: [
					cwd + ':/var/www/html',
				],
			},
			mysql: {
				image: 'mysql:5.7',
				environment: {
					MYSQL_ROOT_PASSWORD: 'password',
					MYSQL_DATABASE: 'wordpress_develop',
				},
				healthcheck: {
					test: [ 'CMD', 'mysql', '-e', 'SELECT 1', '-uroot', '-ppassword' ],
					interval: '1s',
					retries: '100',
				}
			},
			phpunit: {
				build: {
					context: '.',
					dockerfile: 'Dockerfile-phpunit',
				},
				volumes: [
					cwd + ':/wordpress-develop',
				],
			},
		},
	};

	yaml.writeSync( TOOLS_DIR + '/docker-compose.yml', defaultOptions );

	copyFileSync( __dirname + '/Dockerfile', TOOLS_DIR + '/Dockerfile' );
	copyFileSync( __dirname + '/Dockerfile-phpunit', TOOLS_DIR + '/Dockerfile-phpunit' );

	debug( 'Starting docker containers' );
	await spawn( 'docker-compose', [
		'up',
		'-d',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
	} );

	statusWindow.send( 'status', 'error', 'Building WordPress...' );

	addAction( 'grunt_watch_first_run_finished', 'installWordPress', installWordPress );

	if ( didAction( 'grunt_watch_first_run_finished' ) ) {
		installWordPress();
	}
}

/**
 * Runs the WP-CLI commands to install WordPress.
 */
async function installWordPress() {
	statusWindow.send( 'status', 'error', 'Installing WordPress...' );

	debug( 'Waiting for mysqld to start in the MySQL container' );
	while ( 1 ) {
		const { stdout } = await spawn( 'docker', [
			'inspect',
			'--format',
			'{{json .State.Health.Status }}',
			'tools_mysql_1',
		], {
			cwd: TOOLS_DIR,
			env: {
				PATH: process.env.PATH,
			},
		} );

		if ( stdout.toString().trim() === '"healthy"' ) {
			break;
		}

		sleep( 1000 );
	}

	debug( 'Checking if WordPress is installed' );
	const isInstalled = await runCLICommand( 'core', 'is-installed' );
	if ( isInstalled ) {
		debug( 'Updating site URL' );
		await runCLICommand( 'option', 'update', 'home', 'http://localhost:' + port );
		await runCLICommand( 'option', 'update', 'siteurl', 'http://localhost:' + port );
		return;
	}

	debug( 'Creating wp-config.php file' );
	await runCLICommand( 'config',
		'create',
		'--dbname=wordpress_develop',
		'--dbuser=root',
		'--dbpass=password',
		'--dbhost=mysql',
		'--path=/var/www/html/build' );

	if ( existsSync( cwd + '/build/wp-config.php' ) ) {
		debug( 'Moving wp-config.php out of the build directory' );
		renameSync( cwd + '/build/wp-config.php', cwd + '/wp-config.php' )
	}

	debug( 'Adding debug options to wp-config.php' );
	await runCLICommand( 'config', 'set', 'WP_DEBUG', 'true', '--raw', '--type=constant' );
	await runCLICommand( 'config', 'set', 'SCRIPT_DEBUG', 'true', '--raw', '--type=constant' );
	await runCLICommand( 'config', 'set', 'WP_DEBUG_DISPLAY', 'true', '--raw', '--type=constant' );

	debug( 'Installing WordPress' );
	await runCLICommand( 'core',
		'install',
		'--url=localhost:' + port,
		'--title=WordPress Develop',
		'--admin_user=admin',
		'--admin_password=password',
		'--admin_email=test@test.test' );

	statusWindow.send( 'status', 'okay', 'Ready!' );

	debug( 'WordPress ready at http://localhost:%d/', port );
}

/**
 * Spawns a process to run a WP-CLI command in a Docker container.
 *
 * @param {...String} args The WP-CLI command and arguments to be run.
 * @return Promise that resolves to true if the command succeeded, false if it failed.
 */
function runCLICommand( ...args ) {
	return spawn( 'docker-compose', [
			'run',
			'--rm',
			'cli',
			...args,
		], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
	} )
	.then( () => true )
	.catch( ( error ) => {
		debug( error.stderr.toString().trim() );
		return false;
	} );
}

/**
 * Action handler for when preferences have been saved.
 *
 * @param {Object} newPreferences The new preferences that have just been saved.
 */
async function preferencesSaved( newPreferences ) {
	if ( cwd === newPreferences.basic[ 'wordpress-folder' ] && port === newPreferences.site.port ) {
		return;
	}

	debug( 'Preferences saved, stopping containers' );

	await spawn( 'docker-compose', [
		'down',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
	} );

	startDocker();
}

/**
 * Shutdown handler, to ensure the docker containers are shut down cleanly.
 */
function shutdown() {
	spawnSync( 'docker-compose', [
		'down',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
	} );
}

module.exports = {
	registerDockerJob,
};
