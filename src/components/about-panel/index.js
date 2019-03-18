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
		const repositoryLink = (
			<Button
				isLink
				className="about-panel__repository-link"
				onClick={ () => shell.openExternal( 'https://github.com/pento/testpress' ) }
			>
				GitHub repository
			</Button>
		);

		return (
			<div className="about-panel">
				<p>
					<strong>
						<span role="img" aria-label="">
							💃
						</span>
						TestPress
					</strong>
				</p>
				<p>Version { remote.app.getVersion() }</p>
				<p>
					Please submit bug reports to the { repositoryLink } along with a copy of the debug
					log.
				</p>
				<p>
					<Button isLarge onClick={ () => shell.openItem( logPath ) }>
						View debug log
					</Button>
				</p>
			</div>
		);
	}
}

export default AboutPanel;
