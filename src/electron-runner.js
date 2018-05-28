const {app, BrowserWindow, ipcMain, Tray} = require('electron')
const ElectronPreferences = require( 'electron-preferences' );

const path = require('path');
const url = require('url');

const assetsDirectory = path.join(__dirname, '/../assets/')

const preferences = new ElectronPreferences( {
	dataStore: path.resolve( app.getPath( 'userData' ), 'preferences.json' ),
	defaults: {
		basic: {
			'wordpress-folder': '',
		},
	},
	sections: [ {
		id: 'basic',
		label: 'Basic Settings',
		icon: 'folder-15',
		form: {
			groups: [ {
				label: 'WordPress',
				fields: [ {
					label: 'WordPress Folder',
					key: 'wordpress-folder',
					type: 'directory',
					help: 'The location where your WordPress repo is stored.'
				} ],
			} ],
		},
	} ],
} );

let tray = undefined;
let window = undefined;

app.dock.hide();

const createTray = () => {
	tray = new Tray( path.join( assetsDirectory, 'tray-logo.png' ) );
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
    window = new BrowserWindow({
		width: 300,
		height: 500,
		show: false,
		frame: false,
		fullscreenable: false,
		resizable: false,
		transparent: true,
		skipTaskbar: true,
		webPreferences: {
		  // Prevents renderer process code from not running when window is
		  // hidden
		  backgroundThrottling: false,
		},
	  } );

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format( {
            pathname: path.join( __dirname, '/../build/index.html' ),
            protocol: 'file:',
            slashes: true,
        } );
		window.loadURL( startUrl );

	window.on('blur', () => {
		if ( ! window.webContents.isDevToolsOpened() ) {
		  window.hide();
		}
	  })

    // Emitted when the window is closed.
    window.on( 'closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
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
	const position = getWindowPosition();
	window.setPosition( position.x, position.y, false );
	window.show();
	window.focus();
};

const getWindowPosition = () => {
	const windowBounds = window.getBounds();
	const trayBounds = tray.getBounds();

	// Center window horizontally below the tray icon
	const x = Math.round( trayBounds.x + ( trayBounds.width / 2 ) - ( windowBounds.width / 2 ) );

	// Position window 4 pixels vertically below the tray icon
	const y = Math.round( trayBounds.y + trayBounds.height + 4 );

	return { x: x, y: y };
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on( 'ready', () => {
	createTray();
	createWindow();
} );

// Quit when all windows are closed.
app.on( 'window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if ( process.platform !== 'darwin' ) {
        app.quit();
    }
} );
