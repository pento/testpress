import React, { Component } from 'react';
import Gridicon from 'gridicons';

import './style.css';

const { ipcRenderer } = window.require( 'electron' );

class PreferencesButton extends Component {
	openPreferences() {
		ipcRenderer.send( 'showPreferences' );
	}

	render() {
		return (
			<div className="preferences-button">
				<Gridicon
					icon="cog"
					onClick={ this.openPreferences }
				/>
			</div>
		);
	}
}

export default PreferencesButton;
