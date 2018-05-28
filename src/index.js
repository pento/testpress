import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import WPde from './app';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render( <WPde />, document.getElementById('root') );
registerServiceWorker();
