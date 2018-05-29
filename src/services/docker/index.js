const compose = require( 'docker-compose' );
const yaml = require( 'node-yaml' );
const { copyFileSync } = require( 'fs' );
const { spawn, spawnSync } = require( 'child_process' );
const process = require( 'process' );

const { TOOLS_DIR } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

const NODE_DIR = TOOLS_DIR + '/node';
const NODE_BIN = NODE_DIR + '/bin/node';

/**
 * Get docker up and running
 */
function registerDockerJob() {
	const cwd = preferences.value( 'basic.wordpress-folder' );
	const port = preferences.value( 'site.port' ) || 9999;

	if ( ! cwd ) {
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

	compose.up( { cwd: TOOLS_DIR } )
		.then( () => {
			console.log( 'Containers started' );
			installWordPress();
		} );
}

function installWordPress() {
	const port = preferences.value( 'site.port' ) || 9999;

	const isInstalled = spawnSync( 'docker-compose', [
		'run',
		'cli',
		'core',
		'is-installed',
	], {
		cwd: TOOLS_DIR,
		env: {
			PATH: process.env.PATH,
		},
	} );

	if ( 0 !== isInstalled.status ) {
		const configCreate = spawn( 'docker-compose', [
			'run',
			'cli',
			'config',
			'create',
			'--dbname=wordpress_develop',
			'--dbuser=root',
			'--dbpass=password',
			'--dbhost=mysql',
		], {
			cwd: TOOLS_DIR,
			env: {
				PATH: process.env.PATH,
			},
		} );

		configCreate.on( 'close', () => {
			spawn( 'docker-compose', [
				'run',
				'cli',
				'core',
				'install',
				'--url=localhost:' + port,
				'--title="WordPress Develop"',
				'--admin_user=admin',
				'--admin_password=password',
				'--admin_email=test@test.test',
			], {
				cwd: TOOLS_DIR,
				env: {
					PATH: process.env.PATH,
				},
			} );
		} );
	}
}

module.exports = {
	registerDockerJob,
};
