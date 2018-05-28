import React, { Component } from 'react';
import logo from './logo.svg';
import PreferencesButton from '../components/preferences';
import './style.css';

class WPde extends Component {
	render() {
		return (
			<div className="wpde">
				<PreferencesButton />
				<header className="wpde-header">
					<img src={logo} className="wpde-logo" alt="logo" />
					<h1 className="wpde-title">Welcome to WordPress</h1>
				</header>
				<p className="wpde-intro">
					There isn't much to look at, yet. :-)
				</p>
			</div>
		);
	}
}

export default WPde;
