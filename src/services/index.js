const { mkdirSync, existsSync } = require( 'fs' );

const { TOOLS_DIR, ARCHIVE_DIR } = require( './constants.js' );
const { registerNodeJob } = require( './node-downloader' );

const registerJobs = () => {
	if ( ! existsSync( TOOLS_DIR ) ) {
		mkdirSync( TOOLS_DIR );
	}

	if ( ! existsSync( ARCHIVE_DIR ) ) {
		mkdirSync( ARCHIVE_DIR );
	}

	registerNodeJob();
};

module.exports = {
	registerJobs,
	TOOLS_DIR,
	ARCHIVE_DIR,
};
