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
			activeTab: 'Basic',
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

		if ( directory && directory !== this.state.directory ) {
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
		const { directory, editedPort, activeTab } = this.state;

		const dirLabel = directory ? directory : 'No folder selected';

		const tabs = {
			Basic: (
				<div>
					<label htmlFor="preferences-folder">Folder:</label>
					{ dirLabel }
					<button
						id="preferences-folder"
						onClick={ this.showDirectorySelect }
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
						onChange= { event => this.setState( { editedPort: event.target.value } ) }
						onBlur={ () => this.portChanged() }
					/>
				</div>
			)
		};

		return (
			<div className="preferences">
				<div className="preferences-tabs">
					{ Object.keys( tabs ).map( ( label ) => {
						const className = label === activeTab ? 'active' : 'inactive';
						return (
							<span
								className={ className }
								onClick={ () => this.setState( { activeTab: label } ) }
								key={ label + '-tab' }
							>
								{ label }
							</span>
						);
					} ) }
				</div>
				<div className="preferences-pages">
					{ Object.keys( tabs ).map( ( label ) => {
						const className = 'page-' + label.toLowerCase() + ' ' + ( label === activeTab ? 'active' : 'inactive' );
						return (
							<div
								className={ className }
								key={ label + '-page' }
							>
								{ tabs[ label ] }
							</div>
						);
					} ) }
				</div>
			</div>
		);
	}
}

export default PreferencesPanel;
