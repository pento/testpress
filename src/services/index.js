const { mkdirSync, existsSync } = require( 'fs' );
const { app } = require( 'electron' );

const { registerNodeJob } = require( './node-downloader' );

const TOOLS_DIR = app.getPath( 'userData' ) + '/tools';

const registerJobs = () => {
	if ( ! existsSync( TOOLS_DIR ) ) {
		mkdirSync( TOOLS_DIR );
	}

	registerNodeJob();
};

module.exports = {
	registerJobs
};
