import React, { Component } from 'react';

import logo from './logo.svg';
import PreferencesButton from '../components/preferences';
import StatusPanel from '../components/status';

import './style.css';

class WPde extends Component {
	render() {
		return (
			<div className="wpde">
				<PreferencesButton />
				<div className="wpde-main">
					<header className="wpde-header">
						<img src={logo} className="wpde-logo" alt="logo" />
						<h1 className="wpde-title">Welcome to WordPress</h1>
					</header>
				</div>
				<StatusPanel />
			</div>
		);
	}
}

export default WPde;
