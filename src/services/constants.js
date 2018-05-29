const { app } = require( 'electron' );

const TOOLS_DIR = app.getPath( 'userData' ) + '/tools';
const ARCHIVE_DIR = TOOLS_DIR + '/archives';

module.exports = {
	TOOLS_DIR,
	ARCHIVE_DIR,
};
