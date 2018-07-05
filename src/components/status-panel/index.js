import React, { Component } from 'react';

import 'status-indicator/styles.css'
import './style.css';

const { shell, ipcRenderer } = window.require( 'electron' );

class StatusPanel extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			status: 'intermediary',
			message: 'Building environment ...',
			errors: '',
		}

		this.descriptions = {
			positive: (
				<div>
					<p>To use your environment, click on the link above, then login with these credentials.</p>
					<p>Username: <strong>admin</strong><br/>
					Password: <strong>password</strong></p>
				</div>
			),
			intermediary: (
				<p>We're building your environment right now, just sit back and we'll let you know when it's all ready.</p>
			),
			negative: (
				<div>
					<p>Something went wrong, here's what we know. Please send this info to your friendly WPDE support crew.</p>
				</div>
			),
		}

		this.statusUpdate = this.statusUpdate.bind( this );
	}

	componentDidMount() {
		ipcRenderer.on( 'status', this.statusUpdate );
	}

	statusUpdate( event, status, message, errors = '' ) {
		this.setState( { status, message, errors } );
	}

	render() {
		const { status, message, errors } = this.state;
		const statusProps = {};
		statusProps[ status ] = '';

		if ( [ 'intermediary', 'negative' ].indexOf( status ) > -1 ) {
			statusProps.pulse = '';
		}

		const preferences = ipcRenderer.sendSync( 'getPreferences' );
		const url = 'http://localhost:' + preferences.site.port;

		return (
			<div className="status">
				<div className="status-row">
					<status-indicator { ...statusProps } />
					<span className="status-message">
						{ message }
					</span>
					{ 'positive' === status &&
						<span
							className="status-site"
							onClick={ () => shell.openExternal( url ) }
						>
							{ url }
						</span>
					}
				</div>
				<div className="status-description">
					{ this.descriptions[ status ] }
					{ 'negative' === status &&
						<textarea readOnly>{ errors }</textarea>
					}
				</div>
			</div>
		);
	}
}

export default StatusPanel;
