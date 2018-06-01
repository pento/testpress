const { app } = require( 'electron' );
const { normalize } = require( 'path' );

const TOOLS_DIR = normalize( app.getPath( 'userData' ) + '/tools' );
const ARCHIVE_DIR = normalize( TOOLS_DIR + '/archives' );

const NODE_DIR = normalize( TOOLS_DIR + '/node' );
const NPM_CACHE_DIR = normalize( ARCHIVE_DIR + '/npm-cache' );

const nodeBin = ( 'win32' === process.platform ) ? '/node.exe' : '/bin/node';
const npmBin = ( 'win32' === process.platform ) ? '/node_modules/npm/bin/npm-cli.js' : '/bin/npm';

const NODE_BIN = normalize( NODE_DIR + nodeBin );
const NPM_BIN = normalize( NODE_DIR + npmBin );

module.exports = {
	TOOLS_DIR,
	ARCHIVE_DIR,
	NODE_DIR,
	NPM_CACHE_DIR,
	NODE_BIN,
	NPM_BIN,
};
