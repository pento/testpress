const yaml = require( 'node-yaml' );
const { copyFileSync, existsSync, renameSync } = require( 'fs' );
const { spawnSync } = require( 'child_process' );
const { spawn } = require( 'promisify-child-process' );
const process = require( 'process' );
const { addAction, didAction } = require( '@wordpress/hooks' );
const sleep = require( 'system-sleep' );
const debug = require( 'debug' )( 'wpde:services:docker' );
const { webContents } = require( 'electron' );
const { normalize } = require( 'path' );
const csv = require( 'csvtojson' );

const { TOOLS_DIR } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

let cwd = '';
let port = 9999;

let statusWindow = null;

const dockerEnv = {};

let USING_TOOLBOX = false;

/**
 * Registers the Docker actions, then starts Docker.
 */
async function registerDockerJob( window ) {
	debug( 'Registering job' );

	statusWindow = window;
	if ( 'win32' === process.platform ) {
		USING_TOOLBOX = await detectToolbox();
	}

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
					normalize( cwd ) + ':/var/www/html',
				],
			},
			cli: {
				image: 'wordpress:cli',
				volumes: [
					normalize( cwd ) + ':/var/www/html',
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

	yaml.writeSync( normalize( TOOLS_DIR + '/docker-compose.yml' ), defaultOptions );

	copyFileSync( normalize( __dirname + '/Dockerfile' ), normalize( TOOLS_DIR + '/Dockerfile' ) );
	copyFileSync( normalize( __dirname + '/Dockerfile-phpunit' ), normalize( TOOLS_DIR + '/Dockerfile-phpunit' ) );

	if ( USING_TOOLBOX ) {
		await startDockerMachine();
	}

	debug( 'Starting docker containers' );
	await spawn( 'docker-compose', [
		'up',
		'-d',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
			...dockerEnv,
		},
		shell: true,
	} ).catch( ( error ) => debug( error.stderr.toString() ) );

	debug( 'Docker containers started' );

	statusWindow.send( 'status', 'error', 'Building WordPress...' );

	addAction( 'grunt_watch_first_run_finished', 'installWordPress', installWordPress );

	if ( didAction( 'grunt_watch_first_run_finished' ) ) {
		installWordPress();
	}
}

/**
 * When we're using Docker Toolbox, then we need to check that the host machine is up and running.
 */
async function startDockerMachine() {
	debug( 'Starting docker machine' );
	await spawn( 'docker-machine', [
		'start',
		'default',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
		shell: true,
	} ).catch( ( error ) => debug( error.stderr.toString() ) );

	const vboxManage = normalize( process.env.VBOX_MSI_INSTALL_PATH + '/VBoxManage' );

	debug( 'Configuring machine port forwarding' );
	await spawn( '"' + vboxManage + '"', [
		'controlvm',
		'"default"',
		'natpf1',
		'delete',
		'wphttp',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
		shell: true,
	} ).catch( ( error ) => debug( error.stderr.toString() ) );

	await spawn( '"' + vboxManage + '"', [
		'controlvm',
		'"default"',
		'natpf1',
		'wphttp,tcp,127.0.0.1,' + port + ',,' + port,
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
		shell: true,
	} ).catch( ( error ) => debug( error.stderr.toString() ) );

	debug( 'Collecting docker environment info' );
	const { stdout } = await spawn( 'docker-machine', [
		'env',
		'default',
		'--shell',
		'cmd',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
		shell: true,
	} ).catch( ( error ) => debug( error.stderr.toString() ) );

	stdout.toString().split( "\n" ).forEach( ( line ) => {
		// Environment info is in the form: SET ENV_VAR=value
		if ( ! line.startsWith( 'SET' ) ) {
			return;
		};

		const parts = line.trim().split( /[ =]/, 3 );
		if ( 3 === parts.length ) {
			dockerEnv[ parts[ 1 ] ] = parts[ 2 ];
		}
	} );

	debug( 'Docker environment: %O', dockerEnv );
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
				...dockerEnv,
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
			...dockerEnv,
		},
	} )
	.then( () => true )
	.catch( ( error ) => {
		debug( error.stderr.toString().trim() );
		return false;
	} );
}

/**
 * Figure out if we're using Docker Toolbox or not. Uses Docker for Windows' version and Hyper-V
 * requirements as a baseline to determine whether Toolbox is being used.
 * 
 * @returns {Boolean} true if Docker Toolbox is being used, false if it isn't.
 */
async function detectToolbox() {
	debug( 'Detecting if we should use Docker Toolbox or not' );
	const { stdout } = await spawn( 'systeminfo', [
			'/FO',
			'CSV',
		], {
		env: {
			PATH: process.env.PATH,
		},
	} );

	const info = ( await csv().fromString( stdout.toString() ) )[ 0 ];

	if ( ! info[ 'OS Name' ].includes( 'Pro' ) ) {
		debug( 'Not running Windows Pro' );
		return true;
	}

	if ( info[ 'OS Version' ].match( /^\d+/ )[0] < 10 ) {
		debug( 'Not running Windows 10' );
		return true;
	}

	if ( info[ 'OS Version' ].match( /\d+$/ )[0] < 14393 ) {
		debug( 'Not running build 14393 or later' );
		return true;
	}

	const hyperv = info[ 'Hyper-V Requirements' ].split( ',' );

	return hyperv.reduce( ( allowed, line ) => {
		const [ requirement, enabled ] = line.split( ':' ).map( ( val ) => val.trim().toLowerCase() );
		if ( 'yes' !== enabled ) {
			debug( "Don't have Hyper-V requirement \"%s\" available", requirement );
			return false;
		}
		return allowed;
	}, true );
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
			...dockerEnv,
		},
	} );

	startDocker();
}

/**
 * Shutdown handler, to ensure the docker containers are shut down cleanly.
 */
function shutdown() {
	debug( 'Shutdown, stopping containers' );
	spawnSync( 'docker-compose', [
		'down',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
			...dockerEnv,
		},
	} );
}

module.exports = {
	registerDockerJob,
};
