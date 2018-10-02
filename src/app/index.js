/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import Pages from '../components/pages';
import PreferencesPanel from '../components/preferences-panel';
import StatusPanel from '../components/status-panel';
import AboutPanel from '../components/about-panel';
import PatchingPanel from '../components/patching-panel';

import './style.scss';

class TestPress extends Component {
	constructor() {
		super( ...arguments );

		this.pages = [ {
			heading: 'TestPress',
			panel: ( <StatusPanel /> ),
		}, {
			heading: 'Preferences',
			panel: ( <PreferencesPanel /> ),
		}, {
			heading: 'About TestPress',
			panel: ( <AboutPanel /> ),
		}, {
			heading: 'Patching',
			panel: ( <PatchingPanel /> ),
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
