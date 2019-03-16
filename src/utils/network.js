const debug = require( 'debug' )( 'testpress:utils:network' );
const nodeFetch = require( 'node-fetch' );
const promisePipe = require( 'promisepipe' );

/**
 * Fetches a URL, and returns the content.
 *
 * @param {string} url The URL to fetch.
 *
 * @return {Promise<string|boolean>} A Promise that resolves to the content from the URL, or false if the fetch failed.
 */
async function fetch( url ) {
	return await nodeFetch( url )
		.then( ( res ) => {
			return res.text();
		} )
		.catch( ( error ) => {
			debug( 'Unable to fetch %s: %s', url, error );
			return false;
		} );
}

/**
 * Fetches a URL, and writes it to a fileStream.
 *
 * @param {string} url The URL to fetch.
 * @param {tty.WriteStream} fileStream The file to write to.
 *
 * @return {Promise<boolean>} A Promise that resolves to true if the fetch succeeded, false if it didn't.
 */
async function fetchWrite( url, fileStream ) {
	return await nodeFetch( url )
		.then( ( res ) => promisePipe( res.body, fileStream ) )
		.then( () => true )
		.catch( ( error ) => {
			debug( 'Unable to fetch %s: %s', url, error );
			return false;
		} );
}

module.exports = {
	fetch,
	fetchWrite,
};
