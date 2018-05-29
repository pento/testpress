const { spawn } = require( 'child_process' );
const { addAction } = require( '@wordpress/hooks' );

const { TOOLS_DIR } = require( '../constants.js' );
const { preferences } = require( '../../preferences' );

const NODE_DIR = TOOLS_DIR + '/node';
const NODE_BIN = NODE_DIR + '/bin/node';

let watchProcess = buildProcess = null;

/**
 * Registers a watcher for when Grunt needs to run on the WordPress install.
 */
function registerGruntJob() {
	addAction( 'npm_install_finished', 'runGruntBuild', runGruntBuild );
}

/**
 * If the WordPress folder is defined, run `grunt build`, then `grunt watch` on it.
 */
function runGruntBuild() {
	if ( buildProcess ) {
		buildProcess.kill();
		buildProcess = null;
	}

	if ( watchProcess ) {
		watchProcess.kill();
		watchProcess = null;
	}
	const cwd = preferences.value( 'basic.wordpress-folder' );

	if ( ! cwd ) {
		return;
	}

	const grunt = cwd + '/node_modules/.bin/grunt';

	buildProcess = spawn( NODE_BIN, [
		grunt,
		'build',
	], {
		cwd,
		env: {},
	} );

	buildProcess.on( 'close', ( code ) => {
		if ( 0 !== code ) {
			return;
		}

		watchProcess = spawn( NODE_BIN, [
			grunt,
			'watch',
		], {
			cwd,
			env: {},
		} );
	} );
}

module.exports = {
	registerGruntJob,
};
