/**
 * External dependencies
 */
import React from 'react';
import { normalize } from 'path';

/**
 * WordPress dependencies
 */
import { Button, Icon, Spinner } from '@wordpress/components';

/**
 * Electron dependencies
 */
const { shell, remote } = window.require( 'electron' );

const logPath = normalize( remote.app.getPath( 'userData' ) + '/debug.log' );

function StatusMessage( { isReady, children } ) {
	return (
		<div className="status__message">
			{ isReady ? <Icon icon="yes" className="status__message-icon" /> : <Spinner /> }
			<span>{ children }</span>
		</div>
	);
}

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
				<StatusMessage isReady={ statuses.docker === 'ready' }>
					Starting Docker…
				</StatusMessage>
				{ /*
					// TODO: make this work
					<StatusMessage isReady={ statuses.node === 'ready' }>
						Installing node…
					</StatusMessage>
				*/ }
				<StatusMessage isReady={ statuses.grunt === 'ready' }>
					Compiling assets…
				</StatusMessage>
				<StatusMessage isReady={ statuses.wordpress === 'ready' }>
					Installing WordPress…
				</StatusMessage>
			</p>
			<p>
				<Button isLarge onClick={ () => shell.openItem( logPath ) }>View log</Button>
			</p>
		</div>
	);
}
