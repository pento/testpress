import React, { Component } from 'react';

import 'status-indicator/styles.css'
import './style.css';

const { shell, ipcRenderer } = window.require( 'electron' );

class StatusPanel extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			status: 'intermediary',
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
		const statusProps = {};
		statusProps[ status ] = '';

		if ( [ 'intermediary', 'negative' ].indexOf( status ) > -1 ) {
			statusProps.pulse = '';
		}

		const preferences = ipcRenderer.sendSync( 'getPreferences' );
		const url = 'http://localhost:' + preferences.site.port;

		return (
			<div className="status">
				<status-indicator { ...statusProps } />
				<span className="status-message">
					{ message }
				</span>
				{ 'positive' === status &&
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
