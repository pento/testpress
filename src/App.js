import React, { Component } from 'react';
import logo from './logo.svg';
import PreferencesButton from './components/preferences';
import './App.css';

class App extends Component {
	render() {
		return (
			<div className="App">
				<PreferencesButton />
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">Welcome to WordPress</h1>
				</header>
				<p className="App-intro">
					There isn't much to look at, yet. :-)
				</p>
			</div>
		);
	}
}

export default App;
