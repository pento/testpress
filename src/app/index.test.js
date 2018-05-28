import React from 'react';
import ReactDOM from 'react-dom';
import WPde from '.';

it('renders without crashing', () => {
	const div = document.createElement( 'div' );
	ReactDOM.render( <WPde />, div );
	ReactDOM.unmountComponentAtNode( div );
} );
