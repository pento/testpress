/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Electron dependencies
 */
const { ipcRenderer, shell } = window.require( 'electron' );

export default function ReadyInfo() {
	const {
		site: { port },
	} = ipcRenderer.sendSync( 'getPreferences' );
	const siteURL = `http://localhost:${ port }`;
	const adminURL = `http://localhost:${ port }/wp-admin`;

	return (
		<div className="status">
			<p>
				<strong>
					<span role="img" aria-label="Nice!">
						🤘
					</span>
					Ready to rock!
				</strong>
			</p>
			<p>
				TestPress is serving your local copy of the WordPress source code. Go on and build
				something amazing!
			</p>
			<p>
				<a href={ siteURL }>{ siteURL }</a>
				<br />
				Username: admin
				<br />
				Password: password
			</p>
			<p>
				<Button isLarge onClick={ () => shell.openExternal( siteURL ) }>View site</Button>
				<Button isLarge onClick={ () => shell.openExternal( adminURL ) }>WP Admin</Button>
				{ /* TODO: Make this button do something */ }
				{ /* <Button isLarge>WP CLI</Button> */ }
			</p>
		</div>
	);
}
