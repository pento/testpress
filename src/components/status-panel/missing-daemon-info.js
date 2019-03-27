/**
 * External dependencies
 */
import React, { useState } from 'react';

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
const { platform } = window.require( 'process' );
const { existsSync } = window.require( 'fs' );
const { shell } = window.require( 'electron' );

let dockerDesktopURL = 'https://www.docker.com/get-started';
let dockerDesktopName = 'Docker Desktop';
let dockerDesktopPath = null;

if ( platform === 'darwin' ) {
	dockerDesktopURL = 'https://store.docker.com/editions/community/docker-ce-desktop-mac';
	dockerDesktopName = 'Docker Desktop for Mac';
	dockerDesktopPath = '/Applications/Docker.app';
}

if ( platform === 'win32' ) {
	dockerDesktopURL = 'https://store.docker.com/editions/community/docker-ce-desktop-windows';
	dockerDesktopName = 'Docker Desktop for Windows';
	// TODO: Set dockerDesktopPath to something reasonable for Windows.
}

function OpenDockerButton() {
	const [ isOpening, setIsOpening ] = useState( false );

	return (
		<Button
			isLarge
			disabled={ isOpening }
			onClick={ () => {
				shell.openItem( dockerDesktopPath );
				setIsOpening( true );
			} }
		>
			{ isOpening ? `Opening ${ dockerDesktopName }…` : `Open ${ dockerDesktopName }` }
		</Button>
	);
}

export default function MissingDaemonInfo() {
	const link = <ExternalLink href={ dockerDesktopURL }>{ dockerDesktopName }</ExternalLink>;

	let button;

	if ( dockerDesktopPath && existsSync( dockerDesktopPath ) ) {
		button = <OpenDockerButton />;
	} else {
		button = (
			<Button isLarge onClick={ () => shell.openExternal( dockerDesktopURL ) }>
				Download { dockerDesktopName }
			</Button>
		);
	}

	return (
		<div className="status">
			<p>
				<strong>
					<span role="img" aria-label="Hey!">
						👋
					</span>
					Docker is not running
				</strong>
			</p>
			<p>
				A docker server must be running to use TestPress. The easiest way to make this
				happen is to download and install { link }.
			</p>
			<p>{ button }</p>
		</div>
	);
}
