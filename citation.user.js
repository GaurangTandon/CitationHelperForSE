// ==UserScript==
// @name        Citation Helper for StackExchange
// @description Helps insert citations easily on StackExchange
// @author      Gaurang Tandon

// @match       *://*.askubuntu.com/*
// @match       *://*.mathoverflow.net/*
// @match       *://*.serverfault.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @exclude     *://api.stackexchange.com/*
// @exclude     *://blog.stackexchange.com/*
// @exclude     *://blog.stackoverflow.com/*
// @exclude     *://data.stackexchange.com/*
// @exclude     *://elections.stackexchange.com/*
// @exclude     *://openid.stackexchange.com/*
// @exclude     *://stackexchange.com/*
// @exclude     *://*/review

// @grant       none

// @require awesomplete.js
// @require getcitation.js
// @require modalhandler.js

// @version     0.1.1

// ==/UserScript==

/* global chse */

// https://repl.it/repls/CloudyFearfulTrust
// https://repl.it/repls/QuickImmenseActionscript
// https://repl.it/repls/DiscretePastelErrors <-- latest working

/**
* PROBLEMS:
this is missing the date_parts property (the one i'm using)
http://pubs.rsc.org/en/content/articlelanding/2016/cc/c5cc08252h
https://doi.org/10.1002/recl.1964083121
issue raised - https://github.com/CrossRef/rest-api-doc/issues/381

1. pressing enter automatically submits my form to submit Short citation, also, it is hijacking the enter key on title and edit summary fields
awaiting response - https://stackoverflow.com/questions/50771160/prevent-onclick-event-on-a-button-from-firing-when-hitting-enter-in-a-different
2. doesn't work => 10.1007/s706-002-8245-0
 */

function cacheDOI(doi, metadata) {
	var object = JSON.parse(localStorage.getItem(chse.LS_KEY));

	object[doi] = metadata;

	localStorage.setItem(chse.LS_KEY, JSON.stringify(object));
}
