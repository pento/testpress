import React from 'react';
import ReactDOM from 'react-dom';

import TestPress from './app';
import registerServiceWorker from './registerServiceWorker';

import './index.css';

ReactDOM.render( <TestPress />, document.getElementById( 'root' ) );
registerServiceWorker();
