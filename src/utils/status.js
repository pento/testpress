const { ipcMain } = require( 'electron' );
const debug = require( 'debug' )( 'testpress:utils:status' );

let statusWindow;

const statuses = {};

/**
 * Set the BrowserWindow that receives the status message.
 *
 * @param {BrowserWindow} window The window to use.
 */
function setStatusWindow( window ) {
	statusWindow = window;
}

/**
 * Send a status message to the status window.
 *
 * @param {string} service The service which has had a status change.
 * @param {string} status The new status of the service.
 */
function setStatus( service, status ) {
	if ( ! statusWindow ) {
		debug( 'setStatus() called before setStatusWindow, with service "%s", status "%s"', service, status );
		return;
	}

	statuses[ service ] = status;

	statusWindow.send( 'status', statuses );
}

/**
 * Gets the current statuses.
 *
 * @return {Object} An object which maps service names to the status of that service.
 */
function getStatuses() {
	return statuses;
}

ipcMain.on( 'getStatuses', ( event ) => {
	event.returnValue = getStatuses();
} );

module.exports = {
	setStatusWindow,
	setStatus,
	getStatuses,
};
