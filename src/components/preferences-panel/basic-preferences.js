/**
 * External dependencies
 */
import React from 'react';

export default function BasicPreferences( { directory, showDirectorySelect } ) {
	return (
		<div className="preferences-panel">
			<div className="preferences-panel__directory-select">
				<label htmlFor="preferences-wordpress-folder">WordPress Folder:</label>
				{ directory.wordpress ? directory.wordpress : 'No folder selected' }
				<button
					id="preferences-wordpress-folder"
					onClick={ () => showDirectorySelect( 'WordPress' ) }
				>
					{ 'Choose a folder' }
				</button>
			</div>
			<div className="preferences-panel__directory-select">
				<label htmlFor="preferences-gutenberg-folder">Gutenberg Folder:</label>
				{ directory.gutenberg ? directory.gutenberg : 'No folder selected' }
				<button
					id="preferences-gutenberg-folder"
					onClick={ () => showDirectorySelect( 'Gutenberg' ) }
				>
					{ 'Choose a folder' }
				</button>

			</div>
		</div>
	);
}
