import React, { Component } from 'react';
import Gridicon from 'gridicons';

import './style.css';

class PreferencesButton extends Component {
	render() {
		const { togglePreferences, preferencesOpen } = this.props;
		const icon = preferencesOpen ? 'cross' : 'cog';
		return (
			<div className="preferences-button">
				<Gridicon
					icon={ icon }
					onClick={ togglePreferences }
				/>
			</div>
		);
	}
}

export default PreferencesButton;
