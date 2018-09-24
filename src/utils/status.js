const debug = require( 'debug' )( 'testpress:utils:status' );

let statusWindow = undefined;

const statusMap = {
    'okay': 'positive',
    'warning': 'intermediary',
    'error': 'negative',
}

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
 * @param {String} status The status type. Valid values are 'okay', 'warning', or 'error'.
 * @param {String} statusMessage The message to display.
 */
function setStatus( status, statusMessage ) {
    if ( ! statusWindow ) {
        debug( 'setStatus() called before setStatusWindow, with status "%s", message "%s"', status, statusMessage );
        return;
    }

    if ( ! statusMap[ status ] ) {
        debug( 'setStatus() called with invalid status "%s", message "%s"', status, statusWindow );
        return;
    }

    statusWindow.send( 'status', statusMap[ status ], statusMessage );
}

module.exports = {
    setStatusWindow,
	setStatus,
};
