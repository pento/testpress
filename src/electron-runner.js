const { app, BrowserWindow, Tray, ipcMain } = require( 'electron' );
const { doAction } = require( '@wordpress/hooks' );
const path = require( 'path' );
const url = require( 'url' );
const positioner = require( 'electron-traywindow-positioner' );
const { accessSync, mkdirSync } = require( 'fs' );
const debug = require( 'debug' )( 'wpde:runner' );

// Check that the userData directory exists, and create it if needed.
try {
	accessSync( app.getPath( 'userData' ) );
	debug( 'userData directory exists' );
} catch ( err ) {
	debug( "userData directory doesn't exist" );
	mkdirSync( app.getPath( 'userData' ) );
}

const { registerJobs } = require( './services' );
const { setStatusWindow } = require( './utils/status' );

const assetsDirectory = path.join( __dirname, '/../assets/' )

let tray = undefined;
let window = undefined;

if ( 'darwin' === process.platform ) {
	app.dock.hide();
}

const createTray = () => {
	tray = new Tray( path.join( assetsDirectory, 'tray-logoTemplate.png' ) );
	tray.on( 'right-click', toggleWindow );
	tray.on( 'double-click', toggleWindow );
	tray.on( 'click', ( event ) => {
		toggleWindow();

		// Show devtools when command clicked
		if ( window.isVisible() && process.defaultApp && event.metaKey ) {
			window.openDevTools( { mode: 'detach' } );
		}
	})
  }

function createWindow() {
    // Create the browser window.
    window = new BrowserWindow( {
		width: 350,
		height: 300,
		show: false,
		frame: false,
		fullscreenable: false,
		resizable: false,
		transparent: true,
		skipTaskbar: true,
		webPreferences: {
			// Prevents renderer process code from not running when window is hidden
			backgroundThrottling: false,
		},
	} );

	setStatusWindow( window );

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format( {
		pathname: path.join( __dirname, '/../build/index.html' ),
		protocol: 'file:',
		slashes: true,
	} );

	window.loadURL( startUrl );

	window.on( 'blur', () => {
		if ( ! window.webContents.isDevToolsOpened() ) {
			window.hide();
		}
	} );

    window.on( 'closed', () => {
        window = null;
    } );
}

const toggleWindow = () => {
	if ( window.isVisible() ) {
		window.hide();
	} else {
		showWindow();
	}
};

const showWindow = () => {
	const trayBounds = tray.getBounds();

	positioner.position( window, trayBounds );
	window.show();
	window.focus();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on( 'ready', () => {
	createTray();
	createWindow();
	registerJobs();
} );

// Quit when all windows are closed.
app.on( 'window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if ( process.platform !== 'darwin' ) {
        app.quit();
    }
} );

ipcMain.on( 'quit', () => {
	window.close();
	app.quit();
} );

app.on( 'quit', () => {
	doAction( 'shutdown' );
} );
