/**
 * External dependencies
 */
import React from 'react';
import { normalize } from 'path';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Electron dependencies
 */
const { shell, remote } = window.require( 'electron' );

const logPath = normalize( remote.app.getPath( 'userData' ) + '/debug.log' );

export default function NotReadyInfo( { statuses } ) {
	return (
		<div className="status">
			<p>
				<strong>
					<span role="img" aria-label="Wait!">
						✋
					</span>
					Getting ready
				</strong>
			</p>
			<p>Please wait a moment while TestPress gets everything ready.</p>
			<p>
				{ statuses.docker === 'ready' ? '👍' : '👉' } Starting Docker…
				<br />
				{ /* TODO: Make this work */ }
				{ /* { statuses.node === 'ready' ? '👍' : '👉' } Installing node… */ }
				{ /* <br /> */ }
				{ statuses.grunt === 'ready' ? '👍' : '👉' } Compiling assets…
				<br />
				{ statuses.wordpress === 'ready' ? '👍' : '👉' } Installing WordPress…
			</p>
			<p>
				<Button isLarge onClick={ () => shell.openItem( logPath ) }>View log</Button>
			</p>
		</div>
	);
}
