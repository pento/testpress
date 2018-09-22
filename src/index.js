import React from 'react';
import ReactDOM from 'react-dom';

import WPde from './app';
import registerServiceWorker from './registerServiceWorker';

import './index.css';

ReactDOM.render( <WPde />, document.getElementById( 'root' ) );
registerServiceWorker();
