const yaml = require( 'node-yaml' );
const { copyFileSync } = require( 'fs' );
const { spawn } = require( 'promisify-child-process' );
const process = require( 'process' );
const { addAction } = require( '@wordpress/hooks' );
const sleep = require( 'system-sleep' );

const { TOOLS_DIR } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

const NODE_DIR = TOOLS_DIR + '/node';
const NODE_BIN = NODE_DIR + '/bin/node';

let cwd = '';
let port = 9999;

/**
 * Registers the Docker actions, then starts Docker.
 */
function registerDockerJob() {
	addAction( 'preferences_saved', 'preferencesSaved', preferencesSaved, 9 );
	startDocker();
}

/**
 * Get docker up and running.
 */
async function startDocker() {
	cwd = preferences.value( 'basic.wordpress-folder' );
	port = preferences.value( 'site.port' ) || 9999;

	if ( ! cwd || ! port ) {
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
					cwd + '/build:/var/www/html',
				],
			},
			cli: {
				image: 'wordpress:cli',
				volumes: [
					cwd + '/build:/var/www/html',
				],
			},
			mysql: {
				image: 'mysql:5.7',
				environment: {
					MYSQL_ROOT_PASSWORD: 'password',
					MYSQL_DATABASE: 'wordpress_develop',
				},
				healthcheck: {
					test: [ 'CMD', 'mysqladmin', 'ping', '--silent' ],
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

	await spawn( 'docker-compose', [
		'up',
		'-d',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
	} );

	// Wait for mysqld to be available before we continue.
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

	await runCLICommand( 'config',
		'create',
		'--dbname=wordpress_develop',
		'--dbuser=root',
		'--dbpass=password',
		'--dbhost=mysql' );

	await runCLICommand( 'config', 'set', 'WP_DEBUG', 'true', '--raw', '--type=constant' );
	await runCLICommand( 'config', 'set', 'SCRIPT_DEBUG', 'true', '--raw', '--type=constant' );

	await runCLICommand( 'core',
		'install',
		'--url=localhost:' + port,
		'--title=WordPress Develop',
		'--admin_user=admin',
		'--admin_password=password',
		'--admin_email=test@test.test' );
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
		console.log( error.stderr.toString() );
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

module.exports = {
	registerDockerJob,
};
