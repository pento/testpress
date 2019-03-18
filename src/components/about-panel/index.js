/**
 * External dependencies
 */
import React, { Component } from 'react';
import { normalize } from 'path';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

const { shell, remote } = window.require( 'electron' );

const logPath = normalize( remote.app.getPath( 'userData' ) + '/debug.log' );

class AboutPanel extends Component {
	render() {
		return (
			<div className="about-panel">
				<p><strong>Version:</strong> { remote.app.getVersion() }</p>
				<p>
					Please submit bug reports to the <a href="#" onClick={ () => shell.openExternal( 'https://github.com/pento/testpress' ) }>GitHub repository</a>.
				</p>
				<p>
					If something has gone wrong, please also attach the debug log to your bug report.
				</p>
				<p>
					<Button isLarge onClick={ () => shell.openItem( logPath ) }>View debug log</Button>
				</p>
			</div>
		);
	}
}

export default AboutPanel;
