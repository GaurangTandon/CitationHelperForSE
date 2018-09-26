/* global chse */

(function() {
	// from https://github.com/ianstormtaylor/to-no-case

	var hasSpace = /\s/,
		hasSeparator = /(_|-|\.|:)/,
		hasCamel = /([a-z][A-Z]|[A-Z][a-z])/;

	/**
	 * Remove any starting case from a `string`, like camel or snake, but keep
	 * spaces and punctuation that may be important otherwise.
	 *
	 * @param {String} string
	 * @return {String}
	 */

	function toNoCase(string) {
		if (hasSpace.test(string)) return string.toLowerCase();
		if (hasSeparator.test(string)) return (unseparate(string) || string).toLowerCase();
		if (hasCamel.test(string)) return uncamelize(string).toLowerCase();
		return string.toLowerCase();
	}

	/**
	 * Separator splitter.
	 */

	var separatorSplitter = /[\W_]+(.|$)/g;

	/**
	 * Un-separate a `string`.
	 *
	 * @param {String} string
	 * @return {String}
	 */

	function unseparate(string) {
		return string.replace(separatorSplitter, function(m, next) {
			return next ? " " + next : "";
		});
	}

	/**
	 * Camelcase splitter.
	 */

	var camelSplitter = /(.)([A-Z]+)/g;

	/**
	 * Un-camelcase a `string`.
	 *
	 * @param {String} string
	 * @return {String}
	 */

	function uncamelize(string) {
		return string.replace(camelSplitter, function(m, previous, uppers) {
			return (
				previous +
				" " +
				uppers
					.toLowerCase()
					.split("")
					.join(" ")
			);
		});
	}

	// via https://github.com/ianstormtaylor/title-case-minors and https://github.com/ianstormtaylor/to-title-case
	var minors = [
			"a",
			"an",
			"and",
			"as",
			"at",
			"but",
			"by",
			"en",
			"for",
			" from",
			"how",
			"if",
			"in",
			"neither",
			"nor",
			"of",
			"on",
			"only",
			"onto",
			"out",
			"or",
			"per",
			"so",
			"than",
			"that",
			"the",
			"to",
			"until",
			"up",
			"upon",
			"v",
			"v.",
			"versus",
			"vs",
			"vs.",
			"via",
			"when",
			"with",
			"without",
			"yet"
		],
		escaped = minors.map(function(str) {
			return String(str).replace(/([.*+?=^!:${}()|[\]\/\\])/g, "\\$1");
		}),
		minorMatcher = new RegExp("[^^]\\b(" + escaped.join("|") + ")\\b", "ig"),
		punctuationMatcher = /:\s*(\w)/g;

	function toSentenceCase(string) {
		return toNoCase(string)
			.replace(/[a-z]/i, function(letter) {
				return letter.toUpperCase();
			})
			.trim();
	}

	chse.toTitleCase = function(string) {
		return toSentenceCase(string)
			.replace(/(^|\s)(\w)/g, function(matches, previous, letter) {
				return previous + letter.toUpperCase();
			})
			.replace(minorMatcher, function(minor) {
				return minor.toLowerCase();
			})
			.replace(punctuationMatcher, function(letter) {
				return letter.toUpperCase();
			});
	};

	chse.capitalizeFirstLetter = function(word) {
		return word.charAt(0) + word.substring(1).toLowerCase();
	};

	chse.isAllUpcase = function(string) {
		for (var i = 0, len = string.length, ch, isLowerCaseCharacter; i < len; i++) {
			ch = string.charAt(i);
			// logs false for up case characters, numbers, symbols
			isLowerCaseCharacter = ch === ch.toLowerCase() && ch !== ch.toUpperCase();

			if (isLowerCaseCharacter) return false;
		}

		return true;
	};

	chse.endsWithPunctuation = function(string) {
		var lastCharacter = string.charAt(string.length - 1),
			punctuationMarks = [".", "?", "!"];

		return punctuationMarks.indexOf(lastCharacter) > -1;
	};
})();

chse.debugLog("Case helpers loaded");
