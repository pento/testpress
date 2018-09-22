import React, { Component } from 'react';
import Gridicon from 'gridicons';

import './style.css';

const { ipcRenderer, remote } = window.require( 'electron' );
const { Menu, MenuItem, process } = remote;

class PreferencesButton extends Component {
	constructor( props ) {
		super( props );

		this.handleClick = this.handleClick.bind( this );

		this.menu = new Menu();

		const preferencesShortcut = process.platform === 'darwin' ? 'CmdOrCtrl+,' : 'CmdOrCtrl+P';
		const quitShortcut = process.platform === 'darwin' ? 'CmdOrCtrl+Q' : 'Alt+F4';

		this.menu.append( new MenuItem( {
			label: 'Preferences...',
			accelerator: preferencesShortcut,
			click: this.props.togglePreferences,
		} ) );

		this.menu.append( new MenuItem( { type: 'separator'} ) );

		this.menu.append( new MenuItem( {
			label: 'Quit',
			accelerator: quitShortcut,
			click: this.quit,
		} ) );
	}

	handleClick() {
		const { togglePreferences, preferencesOpen } = this.props;

		if ( preferencesOpen ) {
			togglePreferences();
			return;
		}

		this.menu.popup( { window: remote.getCurrentWindow() } );
	}

	quit() {
		ipcRenderer.send( 'quit' );
	}

	render() {
		const { preferencesOpen } = this.props;
		const icon = preferencesOpen ? 'cross' : 'cog';
		const text = preferencesOpen ? 'Close Preferences' : 'Preferences';
		return (
			<button
				className="preferences-button"
				onClick={ this.handleClick }
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
