/* global chse */

(function () {
    // from https://github.com/ianstormtaylor/to-no-case

    const hasSpace = /\s/,
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
        if (hasSpace.test(string)) { return string.toLowerCase(); }
        if (hasSeparator.test(string)) { return (unseparate(string) || string).toLowerCase(); }
        if (hasCamel.test(string)) { return uncamelize(string).toLowerCase(); }
        return string.toLowerCase();
    }

    /**
	 * Separator splitter.
	 */

    const separatorSplitter = /[\W_]+(.|$)/g;

    /**
	 * Un-separate a `string`.
	 *
	 * @param {String} string
	 * @return {String}
	 */

    function unseparate(string) {
        return string.replace(separatorSplitter, (m, next) => (next ? ` ${next}` : ""));
    }

    /**
	 * Camelcase splitter.
	 */

    const camelSplitter = /(.)([A-Z]+)/g;

    /**
	 * Un-camelcase a `string`.
	 *
	 * @param {String} string
	 * @return {String}
	 */

    function uncamelize(string) {
        return string.replace(camelSplitter, (m, previous, uppers) => (
            `${previous
            } ${
                uppers
                    .toLowerCase()
                    .split("")
                    .join(" ")}`
        ));
    }

    // via https://github.com/ianstormtaylor/title-case-minors and https://github.com/ianstormtaylor/to-title-case
    const minors = [
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
            "yet",
        ],
        escaped = minors.map(str => String(str).replace(/([.*+?=^!:${}()|[\]\/\\])/g, "\\$1")),
        minorMatcher = new RegExp(`[^^]\\b(${escaped.join("|")})\\b`, "ig"),
        punctuationMatcher = /:\s*(\w)/g;

    function toSentenceCase(string) {
        return toNoCase(string)
            .replace(/[a-z]/i, letter => letter.toUpperCase())
            .trim();
    }

    chse.toTitleCase = function (string) {
        return toSentenceCase(string)
            .replace(/(^|\s)(\w)/g, (matches, previous, letter) => previous + letter.toUpperCase())
            .replace(minorMatcher, minor => minor.toLowerCase())
            .replace(punctuationMatcher, letter => letter.toUpperCase());
    };

    chse.capitalizeFirstLetter = function (word) {
        return word.charAt(0) + word.substring(1).toLowerCase();
    };

    chse.isAllUpcase = function (string) {
        for (const ch of string) {
            // logs false for up case characters, numbers, symbols
            const isLowerCaseCharacter = ch === ch.toLowerCase() && ch !== ch.toUpperCase();

            if (isLowerCaseCharacter) { return false; }
        }

        return true;
    };

    chse.endsWithPunctuation = function (string) {
        const lastCharacter = string.charAt(string.length - 1),
            punctuationMarks = [".", "?", "!"];

        return punctuationMarks.indexOf(lastCharacter) > -1;
    };
}());

chse.debugLog("Case helpers loaded");
