import React, { Component } from 'react';

import Pages from '../components/pages';
import PreferencesPanel from '../components/preferences-panel';
import TestPanel from '../components/test-panel';
import StatusPanel from '../components/status-panel';
import AboutPanel from '../components/about-panel';

import './style.css';

class TestPress extends Component {
	constructor() {
		super( ...arguments );

		this.pages = [ {
			heading: 'Welcome to TestPress',
			panel: ( <StatusPanel /> ),
		}, {
			heading: 'Tests',
			panel: ( <TestPanel /> ),
		}, {
			heading: 'Preferences',
			panel: ( <PreferencesPanel /> ),
		}, {
			heading: 'About TestPress',
			panel: ( <AboutPanel /> ),
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
