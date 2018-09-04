/* global chse */
// global object for storing info
window.chse = {};
chse.LS_KEY = "cachedEntries";
chse.J_KEY = "journalList";

window.addEventListener("load", function init() {});
var debugMode = true;
chse.debugLog = function() {
	if (debugMode) {
		console.log(...arguments);
	}
};

chse.debugLog("pre.js loaded");
