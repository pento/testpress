/**
 * External dependencies
 */
import React from 'react';

export default function SitePreferences( { port, onPortChange, onPortInputBlur } ) {
	return (
		<div className="preferences-panel">
			<div className="preferences-panel__input preferences-panel__input--short preferences-panel__input--inline">
				<label htmlFor="preferences-port">Port Number:</label>
				<input
					type="number"
					id="preferences-port"
					value={ port }
					onChange={ ( event ) => onPortChange( event.target.value ) }
					onBlur={ onPortInputBlur }
				/>

			</div>
		</div>
	);
}
