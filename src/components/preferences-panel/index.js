import React, { Component } from 'react';

import './style.css';

const { remote } = window.require( 'electron' );

class PreferencesPanel extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			directory: '',
			port: 9999,
		};

		this.showDirectorySelect = this.showDirectorySelect.bind( this );
		this.directorySelected = this.directorySelected.bind( this );
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
		if ( ! paths ) {
			this.setState( { directory: '' } );
		} else {
			this.setState( { directory: paths.shift() } );
		}
	}

	render() {
		const { directory, port } = this.state;

		const dirLabel = directory ? directory : 'No folder selected';

		return (
			<div className="preferences">
				<label for="preferences-folder">
					<span>WordPress Folder</span>
					<button
						id="preferences-folder"
						onClick={ this.showDirectorySelect }
					>
						{ 'Select a folder' }
					</button>
					{ dirLabel }
				</label>
				<label for="preferences-port">
					<span>Port</span>
					<input
						type="port"
						id="preferences-port"
						value={ port }
						onBlur={ ( event ) => this.setState( { port: event.target.value } ) }
					/>
				</label>
			</div>
		);
	}
}

export default PreferencesPanel;
