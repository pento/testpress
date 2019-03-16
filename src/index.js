/**
 * External dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Internal dependencies
 */
import TestPress from './app';
import registerServiceWorker from './registerServiceWorker';

import './index.css';

ReactDOM.render( <TestPress />, document.getElementById( 'root' ) );
registerServiceWorker();
