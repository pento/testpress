/*global GM_xmlhttpRequest */
// ==UserScript==
// @name         TestPress
// @namespace    https://github.com/pento/testpress/
// @version      0.1
// @description  Helper functions that talk to the TestPress app.
// @updateURL    http://localhost:21853/testpress.user.js
// @author       The WordPress Contributors
// @match        *://*.wordpress.org/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

( function() {
	'use strict';

	const attachments = document.querySelectorAll( 'body.core.trac dl.attachments dt' );

	attachments.forEach( ( attachment ) => {
		const attachmentUrl = attachment.querySelector( 'a' ).href.split( '/' );
		const filename = attachmentUrl.pop();

		if ( ! filename.match( /\.(patch|diff)$/ ) ) {
			return;
		}
		const openButton = document.createElement( 'button' );

		openButton.innerHTML = 'Open';
		openButton.addEventListener( 'click', openClickHandler );

		attachment.insertBefore( openButton, attachment.firstChild );
	} );

	/**
	 * When the user clicks on the attachment open button, this will send the details to
	 * TestPress, which can apply the patch.
	 *
	 * @param {Event} event The click event.
	 */
	function openClickHandler( event ) {
		const attachmentUrl = event.target.parentNode.querySelector( 'a' ).href.split( '/' );
		const filename = attachmentUrl.pop();
		const ticket = attachmentUrl.pop();

		GM_xmlhttpRequest( {
			method: 'POST',
			url: 'http://localhost:21853/patch',
			data: JSON.stringify( {
				ticket,
				filename,
			} ),
			responseType: 'json',
		} );
	}
}() );
