// Hazardous overrides some of the functions from "path" to make them work correctly when WPDE is packaged.
require( 'hazardous' );

const yaml = require( 'node-yaml' );
const { copyFileSync, existsSync, renameSync } = require( 'fs' );
const { spawn } = require( 'promisify-child-process' );
const process = require( 'process' );
const { addAction, didAction } = require( '@wordpress/hooks' );
const sleep = require( 'system-sleep' );
const debug = require( 'debug' )( 'wpde:services:docker' );
const { normalize } = require( 'path' );
const csv = require( 'csvtojson' );

const { TOOLS_DIR } = require( '../constants' );
const { preferences } = require( '../../preferences' );
const { setStatus } = require( '../../utils/status' );

let cwd = '';
let port = 9999;

const dockerEnv = {};

let USING_TOOLBOX = false;

/**
 * Registers the Docker actions, then starts Docker.
 */
async function registerDockerJob() {
	debug( 'Registering job' );

	if ( 'win32' === process.platform ) {
		USING_TOOLBOX = await detectToolbox();
	}

	addAction( 'preference_saved', 'preferenceSaved', preferenceSaved, 9 );
	addAction( 'shutdown', 'shutdown', shutdown );

	startDocker();
}

/**
 * Get docker up and running.
 */
async function startDocker() {
	debug( 'Preparing to start Docker' );
	cwd = preferences.value( 'basic', 'wordpress-folder' );
	port = preferences.value( 'site', 'port' ) || 9999;

	if ( ! cwd || ! port ) {
		debug( 'Bailing, preferences not set' );
		return;
	}

	const defaultOptions = {
		version: '3',
		services: {
			'wordpress-develop': {
				image: 'nginx:alpine',
				ports: [
					port + ':80',
				],
				volumes: [
					'./site.conf:/etc/nginx/conf.d/default.conf',
					normalize( cwd ) + ':/var/www',
				],
				links: [
					'php',
				],
			},
			php: {
				image: 'garypendergast/wordpress-develop-php',
				volumes: [
					normalize( cwd ) + ':/var/www',
				],
				links: [
					'mysql',
				],
			},
			cli: {
				image: 'wordpress:cli',
				volumes: [
					normalize( cwd ) + ':/var/www',
				],
			},
			mysql: {
				image: 'mysql:5.7',
				environment: {
					MYSQL_ROOT_PASSWORD: 'password',
					MYSQL_DATABASE: 'wordpress_develop',
				},
				healthcheck: {
					test: [ 'CMD', 'mysql', '-e', 'SHOW TABLES FROM wordpress_develop', '-uroot', '-ppassword', '-hmysql', '--protocol=tcp' ],
					interval: '1s',
					retries: '100',
				},
				volumes: [
					'mysql:/var/lib/mysql',
				]
			},
			phpunit: {
				image: 'garypendergast/wordpress-develop-phpunit',
				volumes: [
					normalize( cwd ) + ':/wordpress-develop',
				],
			},
		},
		volumes: {
			mysql: {},
		},
};

	yaml.writeSync( normalize( TOOLS_DIR + '/docker-compose.yml' ), defaultOptions );

	copyFileSync( normalize( __dirname + '/default.conf' ), normalize( TOOLS_DIR + '/default.conf' ) );

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
	} ).catch( ( error ) => debug( error.stderr.toString() ) );

	debug( 'Docker containers started' );

	setStatus( 'warning', 'Building environment ...' );

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
	setStatus( 'warning', 'Building environment ...' );

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

	debug( 'Checking if a config file exists' );
	const configExists = await runCLICommand( 'config', 'path' );
	if ( ! configExists ) {
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
	}

	debug( 'Checking if WordPress is installed' );
	const isInstalled = await runCLICommand( 'core', 'is-installed' );
	if ( isInstalled ) {
		debug( 'Updating site URL' );
		await runCLICommand( 'option', 'update', 'home', 'http://localhost:' + port );
		await runCLICommand( 'option', 'update', 'siteurl', 'http://localhost:' + port );
	} else {
		debug( 'Installing WordPress' );
		await runCLICommand( 'core',
			'install',
			'--url=localhost:' + port,
			'--title=WordPress Develop',
			'--admin_user=admin',
			'--admin_password=password',
			'--admin_email=test@test.test',
			'--skip-email' );
	}

	setStatus( 'okay', 'Ready :' );

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
	.catch( ( { stdout, stderr } ) => {
		debug( stderr.toString().trim() );
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
 * @param {String} section    The preferences section that the saved preference is in.
 * @param {String} preference The preferences that has been saved.
 * @param {*}      value      The value that the preference has been changed to.
 */
async function preferenceSaved( section, preference, value ) {
	let changed = false;

	if ( section === 'basic' && preference !== 'wordpress-folder' && value !== cwd ) {
		changed = true;
	}

	if ( section === 'site' && preference === 'port' && value !== port ) {
		changed = true;
	}

	if ( ! changed ) {
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
	spawn( 'docker-compose', [
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
