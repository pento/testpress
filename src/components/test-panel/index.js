import React, { Component } from 'react';
import { normalize } from 'path';

import './style.css';

const { shell, remote } = window.require( 'electron' );

class TestPanel extends Component {
	constructor() {
		super( ...arguments );

		this.runCorePhpTests = this.runCorePhpTests.bind( this );
	}

	runCorePhpTests() {
	}

	render() {
		return (
			<div className="test">
				<p>
					<button onClick={ this.runCorePhpTests }>Run Core PHP Tests</button>
				</p>
			</div>
		);
	}
}

export default TestPanel;
