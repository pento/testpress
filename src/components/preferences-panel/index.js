/**
 * External dependencies
 */
import React, { Component } from 'react';
/**
 * Internal dependencies
 */
import Tabs from '../tabs';

import './style.css';
import BasicPreferences from './basic-preferences';
import SitePreferences from './site-preferences';

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
			Basic: <BasicPreferences
				directory={ directory }
				showDirectorySelect={ this.showDirectorySelect }
			/>,
			Site: <SitePreferences
				port={ editedPort }
				onPortChange={ ( value ) => this.setState( { editedPort: value } ) }
				onPortInputBlur={ this.portChanged }
			/>,
		};

		return (
			<div className="preferences">
				<Tabs tabs={ tabs } />
			</div>
		);
	}
}

export default PreferencesPanel;
