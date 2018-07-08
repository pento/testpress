import React, { Component } from 'react';
import Gridicon from 'gridicons';

import './style.css';

class PreferencesButton extends Component {
	render() {
		const { togglePreferences, preferencesOpen } = this.props;
		const icon = preferencesOpen ? 'cross' : 'cog';
		const text = preferencesOpen ? 'Close Preferences' : 'Preferences';
		return (
			<button
				className="preferences-button"
				onClick={ togglePreferences }
				title={ text }
			>
				<Gridicon
					icon={ icon }
				/>
			</button>
		);
	}
}

export default PreferencesButton;
