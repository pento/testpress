/**
 * External dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';
/**
 * Internal dependencies
 */
import TestPress from '.';

it( 'renders without crashing', () => {
	const div = document.createElement( 'div' );
	ReactDOM.render( <TestPress />, div );
	ReactDOM.unmountComponentAtNode( div );
} );
