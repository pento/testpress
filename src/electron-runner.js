const electron = require( 'electron' );
const { app, BrowserWindow, Tray, ipcMain } = electron;
const { doAction } = require( '@wordpress/hooks' );
const path = require( 'path' );
const url = require( 'url' );
const Positioner = require( 'electron-positioner' );
const { autoUpdater } = require( 'electron-updater' );
const schedule = require( 'node-schedule' );
const { accessSync, mkdirSync, createWriteStream } = require( 'fs' );
const intercept = require( 'intercept-stdout' );
const stripColor = require( 'strip-color' );
const { normalize } = require( 'path' );

// We always want to capture debug info.
if ( ! process.env.DEBUG ) {
	process.env.DEBUG = 'testpress:*';
}

const debug = require( 'debug' )( 'testpress:runner' );

// Check that the userData directory exists, and create it if needed.
try {
	accessSync( app.getPath( 'userData' ) );
} catch ( err ) {
	mkdirSync( app.getPath( 'userData' ) );
}

const logFile = createWriteStream( normalize( app.getPath( 'userData' ) + '/debug.log' ), { flags: 'a' } );
intercept( ( message ) => logFile.write( stripColor( message ) ) );

logFile.write( "\n\n" );
const started = new Date();
debug( "TestPress started: %s", started.toUTCString() );
logFile.write( "\n" );

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
		toggleWindow().then( () => {
			// Show devtools when command clicked
			if ( window.isVisible() && process.defaultApp && event.metaKey ) {
				window.openDevTools( { mode: 'detach' } );
			}
		} );
	} );
};

function createWindow() {
    // Create the browser window.
    window = new BrowserWindow( {
		width: 350,
		height: 350,
		show: false,
		frame: false,
		fullscreenable: false,
		resizable: false,
		transparent: true,
		skipTaskbar: true,
		alwaysOnTop: true,
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
		return new Promise( ( resolve ) => {
			window.hide();
			resolve();
		} );
	} else {
		return showWindow();
	}
};

const showWindow = () => {
	const trayBounds = tray.getBounds();
	const positioner = new Positioner( window );
	const activeDisplay = electron.screen.getDisplayMatching( trayBounds );

	let position = 'trayCenter';

	// If the tray icon is too close to the edge of the screen, align the right edge
	// of the window with the icon, instead of centering it.
	if ( trayBounds.x > activeDisplay.bounds.x + activeDisplay.bounds.width - 175 ) {
		trayBounds.x += 7;
		position = 'trayRight';
	}

	const addClassScript =`
	document.body.classList.remove( 'traycenter', 'trayright' );
	document.body.classList.add( '${ position.toLowerCase() }' );
	`;

	return window.webContents.executeJavaScript( addClassScript ).then( () => {
		positioner.move( position, trayBounds );
		window.show();
		window.focus();
	} );
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on( 'ready', () => {
	const rule = new schedule.RecurrenceRule();
	rule.hour = [ 8, 20 ];
	rule.minute = 0;

	schedule.scheduleJob( rule, autoUpdater.checkForUpdatesAndNotify.bind( autoUpdater ) );
	autoUpdater.checkForUpdatesAndNotify();

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
