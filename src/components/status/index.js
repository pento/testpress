import React, { Component } from 'react';
import classname from 'classname';

import './style.css';

const { shell, ipcRenderer } = window.require( 'electron' );

class StatusPanel extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			status: 'error',
			message: 'Starting...',
		}

		this.statusUpdate = this.statusUpdate.bind( this );
	}

	componentDidMount() {
		ipcRenderer.on( 'status', this.statusUpdate );
	}

	statusUpdate( event, status, message ) {
		this.setState( { status, message } );
	}

	render() {
		const { status, message } = this.state;
		const statusClasses = classname( [
			'status-state',
			'status-state_' + status,
		] );

		const preferences = ipcRenderer.sendSync( 'getPreferences' );
		const url = 'http://localhost:' + preferences.site.port;

		return (
			<div className="status">
				<div className={ statusClasses } />
				<div className="status-message">
					{ message }
				</div>
				{ 'error' !== status &&
					<div
						className="status-site"
						onClick={ () => shell.openExternal( url ) }
					>
						{ url }
					</div>
				}
			</div>
		);
	}
}

export default StatusPanel;
