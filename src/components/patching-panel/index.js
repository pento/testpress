/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import './style.css';

const { ipcRenderer } = window.require( 'electron' );

class PatchingPanel extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			patchLocation: '',
		};

		this.applyPatch = this.applyPatch.bind( this );
	}

	applyPatch() {
		const { patchLocation } = this.state;

		ipcRenderer.send( 'applyPatch', patchLocation );
	}

	render() {
		const { patchLocation } = this.state;

		return (
			<div className="patching">
				<h3>Apply a Patch</h3>
				<p>Paste the link to the <tt>.patch</tt> or <tt>.diff</tt> file.</p>
				<p>
					<input
						className="patching-apply-input"
						type="text"
						value={ patchLocation }
						onChange={ ( event ) => this.setState( { patchLocation: event.target.value } ) }
					/>
					<button
						className="patching-apply-button"
						onClick={ this.applyPatch }
					>
						Apply
					</button>
				</p>
				<h3>Upload a Patch</h3>
				<p>Enter the ticket number to upload the current changes.</p>
				<p>
					<input
						className="patching-upload-input"
						type="text"
					/>
					<button
						className="patching-upload-button"
					>
						Apply
					</button>
				</p>
			</div>
		);
	}
}

export default PatchingPanel;
