/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ExternalLink from '../external-link';

/**
 * Electron dependencies
 */
const { remote, ipcRenderer } = window.require( 'electron' );

function selectWordPressFolder() {
	remote.dialog.showOpenDialog(
		remote.BrowserWindow.getFocusedWindow(),
		{
			title: 'Select WordPress Folder',
			properties: [ 'openDirectory' ],
		},
		( [ path ] ) => {
			if ( path ) {
				ipcRenderer.send( 'updatePreference', 'basic', 'wordpress-folder', path );
			}
		}
	);
}

export default function MissingFolderInfo() {
	const desktopLink = (
		<ExternalLink href="https://desktop.github.com">GitHub Desktop</ExternalLink>
	);
	const repositoryLink = (
		<ExternalLink href="https://github.com/WordPress/wordpress-develop">
			wordpress-develop
		</ExternalLink>
	);

	return (
		<div className="status">
			<p>
				<strong>
					<span role="img" aria-label="Hey!">
						👋
					</span>
					Select a WordPress Folder
				</strong>
			</p>
			<p>
				Select the folder containing your local copy of the WordPress source code. The
				easiest way to get a copy of the WordPress source code is by using { desktopLink } to
				clone { repositoryLink }.
			</p>
			<p>
				<Button isLarge onClick={ selectWordPressFolder }>
					Choose WordPress Folder
				</Button>
			</p>
		</div>
	);
}
