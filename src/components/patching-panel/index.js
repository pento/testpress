/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

const { ipcRenderer } = window.require( 'electron' );

class PatchingPanel extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			patchLocation: '',
			uploadTicket: '',
			wporgUsername: '',
			wporgPassword: '',
		};

		this.applyPatch = this.applyPatch.bind( this );
		this.uploadPatch = this.uploadPatch.bind( this );
	}

	applyPatch() {
		const { patchLocation } = this.state;

		ipcRenderer.send( 'applyPatch', patchLocation );
	}

	uploadPatch() {
		const { uploadTicket, wporgUsername, wporgPassword } = this.state;

		ipcRenderer.send( 'uploadPatch', uploadTicket, wporgUsername, wporgPassword );
	}

	render() {
		const { patchLocation, uploadTicket, wporgUsername, wporgPassword } = this.state;

		return (
			<div className="patching-panel">
				<h3>Apply a Patch</h3>
				<p>Paste the link to the <tt>.patch</tt> or <tt>.diff</tt> file.</p>
				<p>
					<input
						className="patching-panel__apply-input"
						type="text"
						value={ patchLocation }
						onChange={ ( event ) => this.setState( { patchLocation: event.target.value } ) }
					/>
					<button
						className="patching-panel__apply-button"
						onClick={ this.applyPatch }
					>
						Apply
					</button>
				</p>
				<h3>Upload a Patch</h3>
				<p>Enter the ticket number and your WordPress.org credentials to upload the current changes.</p>
				<p>
					Ticket:
					<input
						className="patching-panel__upload-input"
						type="text"
						value={ uploadTicket }
						onChange={ ( event ) => this.setState( { uploadTicket: event.target.value } ) }
					/>
					<br />
					Username:
					<input
						className="patching-panel__upload-username"
						type="text"
						value={ wporgUsername }
						onChange={ ( event ) => this.setState( { wporgUsername: event.target.value } ) }
					/>
					<br />
					Password:
					<input
						className="patching-panel__upload-password"
						type="password"
						value={ wporgPassword }
						onChange={ ( event ) => this.setState( { wporgPassword: event.target.value } ) }
					/>
					<button
						className="patching-panel__upload-button"
						onClick={ this.uploadPatch }
					>
						Upload
					</button>
				</p>
			</div>
		);
	}
}

export default PatchingPanel;
