const { mkdirSync, existsSync } = require( 'fs' );

const { TOOLS_DIR, ARCHIVE_DIR } = require( './constants.js' );
const { registerDockerJob } = require( './docker' );
const { registerNodeJob } = require( './node-downloader' );
const { registerNPMJob } = require( './npm-watcher' );
const { registerGruntJob } = require( './grunt' );

const registerJobs = ( window ) => {
	if ( ! existsSync( TOOLS_DIR ) ) {
		mkdirSync( TOOLS_DIR );
	}

	if ( ! existsSync( ARCHIVE_DIR ) ) {
		mkdirSync( ARCHIVE_DIR );
	}

	registerDockerJob( window );
	registerNodeJob( window );
	registerNPMJob( window );
	registerGruntJob( window );
};

module.exports = {
	registerJobs,
	TOOLS_DIR,
	ARCHIVE_DIR,
};
