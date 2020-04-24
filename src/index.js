/**  
 * Reference for A/B Testing: 
 * @see https://github.com/aptonic/ab.js/blob/master/examples/example.html
 * 
 * This page currently hosted at Work.Dev: 
 * @link https://cloudflare-fullstack-internship.leolemain.workers.dev/ 
 */
"use strict";

import { ElementHandler } from "../Utils/ElementHandler.js";
import { DEBUG, ENABLE_COOKIE, URL, STATUS_CODE, FETCH_HEADER, VARIANTS, } from "../Utils/Constants.js";

addEventListener('fetch', event => {

	// Server HTTP Request Methods handlers
	switch (event.request.method) {
		case "GET":
			event.respondWith(getRequestHandler(event.request)); // Due to the project requirements, only GET method is handled
			break;

		case "HEAD":
		case "POST":
		case "PUT":
		case "DELETE":
		case "PATCH":
		case "OPTIONS":
		default:
			event.respondWith(otherRequestHandler());
			break;
	}
})

// #region HTTP Request functions

async function getRequestHandler(request) {

	return getUrlJson(request);
}

async function otherRequestHandler() {
	return new Response("HTTP request method not supported! Please use GET only...", { status: STATUS_CODE.BadRequest });
}

// #endregion


// #region Helper Functions

// HTTP-GET: get data from specified URL, fetch the html variant randomly, and return the html from script
async function getUrlJson(request) {

	var cookieValues = cookieParser(request.headers.get("cookie"));
	var responseFromVariantUrl;
	var responseHeader;
	var jsonData;
	var htmlBody;
	var variationIndex;

	try {

		var responseFromURL = await fetch(URL, FETCH_HEADER);
		if (responseFromURL.ok) {
			jsonData = await responseFromURL.json();
		}

		// Randomly pick 1 of the variants given
		var variantUrl = randomUrlGeneratorWithEP(jsonData.variants);

		// If the url existed in Cookie, presist that URL to the client
		if (cookieValues.hasOwnProperty('urlVariant') && ENABLE_COOKIE) {
			variationIndex = variationParser(cookieValues.urlVariant);
			responseFromVariantUrl = await fetch(cookieValues.urlVariant);

			// Don't need to Set Cookie, because it already there
			responseHeader = {
				headers: {
					'Content-Type': 'text/html',
				}
			};
		} else {
			variationIndex = variationParser(variantUrl);
			responseFromVariantUrl = await fetch(variantUrl);

			// Set Cookie into response header to save url on Client
			responseHeader = {
				headers: {
					'Content-Type': 'text/html',
					'Set-Cookie': 'urlVariant=' + variantUrl
				}
			};
		}

		if (responseFromVariantUrl.ok) {
			htmlBody = await responseFromVariantUrl.text();
		}

		var responseWithHTML = new Response(htmlBody, responseHeader);
		var elemntHandler = new ElementHandler(VARIANTS[variationIndex]);
		var modResponseWithHTML = new HTMLRewriter()
			.on('title', elemntHandler)
			.on('h1#title', elemntHandler)
			.on('p#description', elemntHandler)
			.on('href', elemntHandler)
			.on('a', elemntHandler)
			.transform(responseWithHTML);

		if (DEBUG) {
			console.log("Parsed JSON", jsonData);
			// console.log("Variant url to be requested", variantUrl);
			console.log("cookieValues", cookieValues);
			// console.log("Response from Variant URL", responseFromVariantUrl);
			// console.log("HTML body as Text", htmlBody);
			console.log("Variation", VARIANTS[variationIndex]);
			console.log("Response Header", responseHeader);
		}

		return modResponseWithHTML;

	} catch (error) {
		if (DEBUG) {
			return new Response(error.message || error.toString(), { status: STATUS_CODE.NotFound });
		} else {
			return new Response("HTTP Error: " + error, { status: error.status });
		}
	}
}

/**
* Random url generator with Equal Probability to decide which variant to fetch data from
* Reference: 
* @see https://stackoverflow.com/questions/8877249/generate-random-integers-with-probabilities
 */
function randomUrlGeneratorWithEP(array) {
	var ind = Math.floor(Math.random() * array.length);
	return array[ind];
}

function cookieParser(cookies) {
	var result = null;
	if (cookies.length != 0) {
		// Parse all Cookies from Client's header
		// Reference: https://www.youtube.com/watch?v=8tL5P-RtAH0
		result = cookies
			.split(';')
			.map(cookie => cookie.split('='))
			.reduce((accumulator, [key, value]) => ({ ...accumulator, [key.trim()]: decodeURIComponent(value) }), {});
	}
	return result;
}

// Get the last 
function variationParser(url) {
	return url.slice(url.length - 1);
}

// #endregion
