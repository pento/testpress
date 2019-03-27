/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Electron dependencies
 */
const { shell } = window.require( 'electron' );

export default function ExternalLink( { href, children } ) {
	return (
		// Disable reason: We can't use regular <a>s without an onClick handler in
		// Electron because the href will open within the app shell.
		// eslint-disable-next-line jsx-a11y/anchor-is-valid
		<a
			className="external-link"
			role="link"
			tabIndex="0"
			onClick={ () => shell.openExternal( href ) }
			onKeyPress={ ( { key } ) => {
				if ( key === 'Enter' || key === ' ' ) {
					shell.openExternal( href );
				}
			} }
		>
			{ children }
		</a>
	);
}
