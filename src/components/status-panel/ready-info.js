/**
 * External dependencies
 */
import React from 'react';

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
				<button onClick={ () => shell.openExternal( siteURL ) }>View site</button>
				<button onClick={ () => shell.openExternal( adminURL ) }>WP Admin</button>
				{ /* TODO: Make this button do something */ }
				{ /* <button>WP CLI</button> */ }
			</p>
		</div>
	);
}
