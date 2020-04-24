/**  
 * Reference for A/B Testing: 
 * @see https://github.com/aptonic/ab.js/blob/master/examples/example.html
 * 
 * This page currently hosted at Work.Dev: 
 * @link https://cloudflare-fullstack-internship.leolemain.workers.dev/ 
 */
"use strict";

import { ElementHandler } from "../Utils/ElementHandler.js";
import { DEBUG, URL, REQUEST_HEADER, VARIANTS, } from "../Utils/Constants.js";

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
	return new Response("HTTP request method not supported! Please use GET only...", { status: 400 });
}

// #endregion


// #region Helper Functions

// HTTP-GET: get data from specified URL, fetch the html variant randomly, and return the html from script
async function getUrlJson(request) {
	if (request.method !== "GET") {
		return new Response("Invalid Request received! Please check again.");
	}

	var jsonData;
	var htmlBody;
	try {

		var responseFromURL = await fetch(URL);
		if (responseFromURL.ok) {
			jsonData = await responseFromURL.json();
		}

		// Randomly pick 1 of the variants given
		var variantUrl = randomUrlGeneratorWithEP(jsonData.variants);
		var responseFromVariantUrl = await fetch(variantUrl);

		if (responseFromVariantUrl.ok) {
			htmlBody = await responseFromVariantUrl.text();
		}

		if (DEBUG) {
			// console.log("request param", request);
			// console.log("Response from orginal URL", responseFromURL);
			// console.log("Parsed JSON", jsonData);
			// console.log("Variant url to be return", variantUrl);
			// console.log("Response from Variant URL", responseFromVariantUrl);
			// console.log("HTML body as Text", htmlBody);
		}

		var responseWithHTML = new Response(htmlBody, REQUEST_HEADER);
		var variation = randomUrlGeneratorWithEP(VARIANTS);
		var elemntHandler = new ElementHandler(variation);

		if (DEBUG) {
			console.log("variation", variation);
		}

		let modResponseWithHTML = new HTMLRewriter()
			.on('title', elemntHandler)
			.on('h1#title', elemntHandler)
			.on('p#description', elemntHandler)
			.on('href', elemntHandler)
			.on('a', elemntHandler)
			.transform(responseWithHTML);


	
		return modResponseWithHTML;

	} catch (error) {
		if (DEBUG) {
			return new Response(error.message || error.toString(), { status: 404 });
		} else {
			return errorHandler(error);
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

// Server Error Code handler
function errorHandler(err) {
	if (DEBUG)
		console.error("HTTP Error: " + err, { status: err.status });

	return new Response("HTTP Error: " + err, { status: err.status });
}

// #endregion
