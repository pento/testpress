import React, { Component } from 'react';

import Pages from '../components/pages';
import PreferencesPanel from '../components/preferences-panel';
import StatusPanel from '../components/status-panel';

import './style.css';

class TestPress extends Component {
	constructor() {
		super( ...arguments );

		this.pages = [ {
			heading: 'Welcome to TestPress',
			panel: ( <StatusPanel /> ),
		}, {
			heading: 'Preferences',
			panel: ( <PreferencesPanel /> ),
		} ];
	}

	render() {
		return (
			<div>
				<div className="tray-pointer" />
				<div className="testpress">
					<Pages pages={ this.pages } />
				</div>
			</div>
		);
	}
}

export default TestPress;
