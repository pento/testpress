/**
 * External dependencies
 */
import React, { Component } from 'react';
/**
 * Internal dependencies
 */
import Tabs from '../tabs';

import './style.css';

const { remote, ipcRenderer } = window.require( 'electron' );

class PreferencesPanel extends Component {
	constructor() {
		super( ...arguments );

		const preferences = ipcRenderer.sendSync( 'getPreferences' );

		this.state = {
			directory: {
				wordpress: preferences.basic[ 'wordpress-folder' ],
				gutenberg: preferences.basic[ 'gutenberg-folder' ],
			},
			port: preferences.site.port,
			editedPort: preferences.site.port,
		};

		this.showDirectorySelect = this.showDirectorySelect.bind( this );
		this.directorySelected = this.directorySelected.bind( this );
		this.portChanged = this.portChanged.bind( this );
	}

	showDirectorySelect( name ) {
		remote.dialog.showOpenDialog( remote.BrowserWindow.getFocusedWindow(), {
			title: `Select ${ name } Folder`,
			properties: [
				'openDirectory',
			],
		},
		( paths ) => this.directorySelected( paths, name ) );
	}

	directorySelected( paths, name ) {
		const directory = paths ? paths.shift() : '';
		const preference = name.toLowerCase() + '-folder';

		if ( directory && directory !== this.state.directory[ name.toLowerCase() ] ) {
			const directoryState = this.state.directory;
			directoryState[ name.toLowerCase() ] = directory;
			this.setState( { directory: directoryState } );
			ipcRenderer.send( 'updatePreference', 'basic', preference, directory );
		}
	}

	portChanged() {
		const { editedPort, port } = this.state;

		if ( editedPort !== port ) {
			this.setState( { port: editedPort } );
			ipcRenderer.send( 'updatePreference', 'site', 'port', editedPort );
		}
	}

	render() {
		const { directory, editedPort } = this.state;

		const tabs = {
			Basic: (
				<div>
					<label htmlFor="preferences-wordpress-folder">WordPress Folder:</label>
					{ directory.wordpress ? directory.wordpress : 'No folder selected' }
					<button
						id="preferences-wordpress-folder"
						onClick={ () => this.showDirectorySelect( 'WordPress' ) }
					>
						{ 'Choose a folder' }
					</button>
					<label htmlFor="preferences-gutenberg-folder">Gutenberg Folder:</label>
					{ directory.gutenberg ? directory.gutenberg : 'No folder selected' }
					<button
						id="preferences-gutenberg-folder"
						onClick={ () => this.showDirectorySelect( 'Gutenberg' ) }
					>
						{ 'Choose a folder' }
					</button>
				</div>
			),
			Site: (
				<div>
					<label htmlFor="preferences-port">Port Number:</label>
					<input
						type="number"
						id="preferences-port"
						className="shortinput"
						value={ editedPort }
						onChange={ ( event ) => this.setState( { editedPort: event.target.value } ) }
						onBlur={ () => this.portChanged() }
					/>
				</div>
			),
		};

		return (
			<div className="preferences">
				<Tabs tabs={ tabs } />
			</div>
		);
	}
}

export default PreferencesPanel;
