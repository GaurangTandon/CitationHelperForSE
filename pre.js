/* global chse */
// global object for storing info
window.chse = {};
chse.LS_KEY = "cachedEntries";
chse.J_KEY = "journalList";

window.addEventListener("load", () => { });
const debugMode = false;
chse.debugLog = function (...args) {
    if (debugMode) {
        console.log(...args);
    }
};

chse.debugLog("pre.js loaded");
