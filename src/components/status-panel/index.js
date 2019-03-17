/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';

/**
 * Internal dependencies
 */
import MissingDaemonInfo from './missing-daemon-info';
import MissingFolderInfo from './missing-folder-info';
import NotReadyInfo from './not-ready-info';
import ReadyInfo from './ready-info';
import './style.scss';

/**
 * Electron dependencies
 */
const { ipcRenderer } = window.require( 'electron' );

function useStatuses() {
	const [ statuses, setStatuses ] = useState( {} );

	useEffect( () => {
		function handleStatusChange( event, newStatuses ) {
			setStatuses( newStatuses );
		}

		setStatuses( ipcRenderer.sendSync( 'getStatuses' ) );

		ipcRenderer.on( 'status', handleStatusChange );
		return () => ipcRenderer.off( 'status', handleStatusChange );
	}, [ setStatuses ] );

	return statuses;
}

export default function StatusPanel() {
	const statuses = useStatuses();

	if ( statuses.docker === 'missing-daemon' ) {
		return <MissingDaemonInfo />;
	}

	if ( statuses.docker === 'missing-wordpress-folder' ) {
		return <MissingFolderInfo />;
	}

	const isWaitingForWordPress = statuses.wordpress !== 'ready';
	const isWaitingForGrunt = statuses.grunt !== 'ready' && statuses.grunt !== 'rebuilding';
	if ( isWaitingForWordPress || isWaitingForGrunt ) {
		return <NotReadyInfo statuses={ statuses } />;
	}

	return <ReadyInfo />;
}
