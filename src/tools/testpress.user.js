/*global GM_xmlhttpRequest */
// ==UserScript==
// @name         TestPress
// @namespace    https://github.com/pento/testpress/
// @version      0.1
// @description  Helper functions that talk to the TestPress app.
// @author       The WordPress Contributors
// @match        *://*.wordpress.org/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

( function() {
	'use strict';

	const attachments = document.querySelectorAll( 'body.core.trac dl.attachments dt' );

	attachments.forEach( ( attachment ) => {
		const openButton = document.createElement( 'button' );

		openButton.innerHTML = 'Open';
		openButton.addEventListener( 'click', openClickHandler );

		attachment.insertBefore( openButton, attachment.firstChild );
	} );

	function openClickHandler( event ) {
		const attachmentUrl = event.target.parentNode.querySelector( 'a' ).href.split( '/' );
		const filename = attachmentUrl.pop();
		const ticket = attachmentUrl.pop();

		GM_xmlhttpRequest( {
			method: 'POST',
			url: 'http://localhost:21853',
			data: JSON.stringify( {
				ticket,
				filename,
			} ),
			responseType: 'json',
		} );
	}
}() );
