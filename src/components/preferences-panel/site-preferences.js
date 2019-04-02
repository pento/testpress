/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';

export default function SitePreferences( { port, onPortChange, onPortInputBlur } ) {
	return (
		<div className="preferences-panel">
			<BaseControl
				id="preferences-port"
				className="preferences-panel__input"
				label="Port Number"
			>
				<input
					type="number"
					id="preferences-port"
					value={ port }
					onChange={ ( event ) => onPortChange( event.target.value ) }
					onBlur={ onPortInputBlur }
				/>
			</BaseControl>
			{ /* <div className="preferences-panel__input preferences-panel__input--short preferences-panel__input--inline">
				<label htmlFor="preferences-port">Port Number:</label>

			</div> */ }
		</div>
	);
}
