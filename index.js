// Reference for A/B Testing: https://github.com/aptonic/ab.js/blob/master/examples/example.html


"use strict";

var JSON_DATA;
const DEBUG = true;
const URL = "https://cfw-takehome.developers.workers.dev/api/variants";
const REQUEST_HEADER = {
	headers: { 'Content-Type': 'text/html' }
}

addEventListener('fetch', event => {
	event.respondWith(getUrlJson(event.request));
})

// #region HTTP Request functions

// Handle the request from client
async function handleRequest(request) {
	return getUrlJson(request);
}

// #endregion

// #region Helper Functions

// HTTP-GET: get data from specified URL, fetch the html variant randomly, and return the html from script
async function getUrlJson(request) {
	if (request.method !== "GET") {
		return new Response("Invalid Request received! Please check again.");
	}
	var responseFromURL = await fetch(URL);
	if (responseFromURL.ok) {
		JSON_DATA = await responseFromURL.json();
	} else {
		return errorHandler(responseFromURL);
	}

	// Randomly pick 1 of the variants given
	var variantUrl = randomUrlGeneratorWithEP();


	var htmlBody;
	var responseFromVariantUrl = await fetch(variantUrl);
	if (responseFromVariantUrl.ok) {
		htmlBody = await responseFromVariantUrl.text();
	} else {
		return errorHandler(responseFromVariantUrl);
	}

	var result = new Response(htmlBody, REQUEST_HEADER);
	if (DEBUG) {
		console.log("request param", request);
		console.log("Response from orginal URL", responseFromURL);
		console.log("Parsed JSON", JSON_DATA);
		console.log("Variant url to be return", variantUrl);
		console.log("Response from Variant URL", responseFromVariantUrl);
		// console.log("HTML body as Text", htmlBody);
		console.log("Final Result", result);
	}

	return result;
}


// Random url generator with Equal Probability to decide which variant to fetch data from
// Reference: https://stackoverflow.com/questions/8877249/generate-random-integers-with-probabilities
function randomUrlGeneratorWithEP() {
	var ind = Math.floor(Math.random() * JSON_DATA.variants.length);
	return JSON_DATA.variants[ind];
}

// Server Error Code handler
function errorHandler(err) {
	console.error("HTTP Error: " + err, { status: err.status });
	return new Response("HTTP Error: " + err, { status: err.status });
}

// #endregion