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
const { ipcRenderer, shell, remote } = window.require( 'electron' );
const { spawn } = window.require( 'child_process' );

async function openWPCLITerminal() {
	const preferences = ipcRenderer.sendSync( 'getPreferences' );
	const appDataPath = remote.app.getPath( 'appData' ).replace( /(\s+)/g, '\\\\\\\\$1' );
	const wordpressFolder = preferences.basic[ 'wordpress-folder' ].replace( /(\s+)/g, '\\\\\\\\$1' );
	const dockerConfigFolder = appDataPath + '/testpress/tools/';
	const dockerCompose = dockerConfigFolder + 'docker-compose.yml';
	const dockerComposeScripts = dockerConfigFolder + 'docker-compose.scripts.yml';

	const osascript = `"tell application \\"Terminal\\"
		activate
		set currentTab to do script \\"alias wp='docker-compose -f ${ dockerCompose } -f ${ dockerComposeScripts } run --rm cli'\\"
		delay 2
		do script \\"cd ${ wordpressFolder }\\" in currentTab
	end tell"`;
	await spawn( 'osascript', [ '-e', osascript ], { shell: true } );
}

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
				<Button isLarge onClick={ () => shell.openExternal( siteURL ) }>
					View site
				</Button>
				<Button isLarge onClick={ () => shell.openExternal( adminURL ) }>
					WP Admin
				</Button>
				<Button isLarge onClick={ openWPCLITerminal }>
					WP CLI
				</Button>
			</p>
		</div>
	);
}
