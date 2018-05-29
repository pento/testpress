const compose = require( 'docker-compose' );
const yaml = require( 'node-yaml' );
const { copyFileSync } = require( 'fs' );

const { TOOLS_DIR } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

const NODE_DIR = TOOLS_DIR + '/node';
const NODE_BIN = NODE_DIR + '/bin/node';

/**
 * Get docker up and running
 */
function registerDockerJob() {
	const cwd = preferences.value( 'basic.wordpress-folder' );

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
					'9999:80',
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
		.then( () => console.log( 'DOCKER COMPOSED' ) );
}

module.exports = {
	registerDockerJob,
};
