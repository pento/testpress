import React, { Component } from 'react';

import './style.css';

class PatchingPanel extends Component {
	render() {
		return (
			<div className="patching">
				<h3>Apply a Patch</h3>
				<p>Paste the link to the <tt>.patch</tt> or <tt>.diff</tt> file.</p>
				<p>
					<input
						className="patching-apply-input"
						type="text"
					/>
					<button
						className="patching-apply-button"
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
