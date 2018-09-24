import React from 'react';
import ReactDOM from 'react-dom';
import TestPress from '.';

it('renders without crashing', () => {
	const div = document.createElement( 'div' );
	ReactDOM.render( <TestPress />, div );
	ReactDOM.unmountComponentAtNode( div );
} );
