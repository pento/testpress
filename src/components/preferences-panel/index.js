import React, { Component } from 'react';

import './style.css';

const { remote, ipcRenderer } = window.require( 'electron' );

class PreferencesPanel extends Component {
	constructor() {
		super( ...arguments );

		const preferences = ipcRenderer.sendSync( 'getPreferences' );

		this.state = {
			directory: preferences.basic[ 'wordpress-folder' ],
			port: preferences.site.port,
			editedPort: preferences.site.port,
		};

		this.showDirectorySelect = this.showDirectorySelect.bind( this );
		this.directorySelected = this.directorySelected.bind( this );
		this.portChanged = this.portChanged.bind( this );
	}

	showDirectorySelect() {
		remote.dialog.showOpenDialog( {
				title: "Select WordPress Folder",
				properties: [
					'openDirectory',
				],
			},
			this.directorySelected );
	}

	directorySelected( paths ) {
		const directory = paths ? paths.shift() : '';
		console.log( paths, directory, this.state.directory );
		if ( directory !== this.state.directory ) {
			this.setState( { directory } );
			ipcRenderer.send( 'updatePreference', 'basic', 'wordpress-folder', directory );
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

		const dirLabel = directory ? directory : 'No folder selected';

		return (
			<div className="preferences">
				<label htmlFor="preferences-folder">
					<span>WordPress Folder</span>
					<button
						id="preferences-folder"
						onClick={ this.showDirectorySelect }
					>
						{ 'Select a folder' }
					</button>
					{ dirLabel }
				</label>
				<label htmlFor="preferences-port">
					<span>Port</span>
					<input
						type="port"
						id="preferences-port"
						value={ editedPort }
						onChange= { event => this.setState( { editedPort: event.target.value } ) }
						onBlur={ () => this.portChanged() }
					/>
				</label>
			</div>
		);
	}
}

export default PreferencesPanel;
