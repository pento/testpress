/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';

function DirectorySelect( { id, label, onClick, path } ) {
	return (
		<BaseControl
			id={ id }
			className="preferences-panel__directory-select"
			label={ label }
		>
			<div className="preferences-panel__directory-select-path">
				{ path ? path : 'No folder selected' }
			</div>
			<Button
				id={ id }
				onClick={ onClick }
				isLink
			>
				Choose a folder
			</Button>
		</BaseControl>
	);
}

export default function BasicPreferences( { directory, showDirectorySelect } ) {
	return (
		<div className="preferences-panel">
			<DirectorySelect
				id="preferences-wordpress-folder"
				label="WordPress Folder"
				onClick={ () => showDirectorySelect( 'WordPress' ) }
				path={ directory.wordpress }
			/>
			<DirectorySelect
				id="preferences-gutenberg-folder"
				label="Gutenberg Folder"
				onClick={ () => showDirectorySelect( 'Gutenberg' ) }
				path={ directory.gutenberg }
			/>
		</div>
	);
}
