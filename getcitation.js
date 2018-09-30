/* global chse */

// type of citation to insert; used by citeDOI
// short citation = 1; long citation = 2;
chse.CITATION_TYPE = 1;

chse.citeWebsite = function(URL, callback) {
	// I cannot retrieve author/title of website without using my own external server :(
	// so just do the bare citation
	var citation = URL + " (accessed ",
		time = new Date(),
		months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December"
		];

	citation += months[time.getMonth()] + " " + time.getDate() + ", " + time.getFullYear() + ".";

	callback.call(this, citation);
};

function getDOIMetaData(doi, callback) {
	var cachedObject = JSON.parse(localStorage.getItem(chse.LS_KEY)),
		cachedMetadata;
	if (cachedObject && (cachedMetadata = cachedObject[doi])) {
		chse.citeDOI(doi, callback, cachedMetadata);
		return;
	}

	// ISSUE: I'm supposed to send my email along with this API call, how'd I do that?
	var xhttp = new XMLHttpRequest();
	xhttp.open("GET", "https://api.crossref.org/works/" + doi, true);
	xhttp.setRequestHeader("Content-type", "text/plain");
	xhttp.send();

	xhttp.onload = function(e) {
		var response = JSON.parse(e.srcElement.response),
			metadata;
		if (response.status !== "ok") {
			// possibly not a cross-ref DOI
			alert("Couldn't fetch citation for DOI: " + doi + ". Please report the doi to the userscript author.");
			return;
		}
		metadata = response.message;
		chse.cacheDOI(doi, metadata);
		chse.citeDOI(doi, callback, metadata);
	};
}

// *J. Am. Chem. Soc.* **2018,** *140,* 1855
// or *J. Am. Chem. Soc.* **2018,** *140* (2), 1855
// Jounral name Year, Volume (Issue), Pages
function shortCiteDOI(doi, metadata) {
	var output = "[" + getTitleYearIssuePagesForCitation(metadata) + "](https://doi.org/" + doi + ")";

	return output;
}

// doi must be the doi (10(.\d+)+) and nothing else
chse.citeDOI = function(doi, callback, metadata) {
	if (metadata === undefined) {
		getDOIMetaData(doi, callback);
		return;
	}

	var output = "";

	console.log(metadata);

	if (chse.CITATION_TYPE === 1) {
		callback.call(this, shortCiteDOI(doi, metadata));
		return;
	}

	output += citeAuthors(metadata.author);
	output += citeTitle(metadata.title[0]) + " ";
	output += getTitleYearIssuePagesForCitation(metadata);

	output += " [DOI: " + doi + "](https://doi.org/" + doi + ").";

	callback.call(this, output);
};

function getTitleYearIssuePagesForCitation(metadata) {
	var issue = metadata.issue,
		output = "*" + getShortJournalTitle(metadata) + "*",
		volume = metadata.volume,
		page = metadata.page;

	output += " **" + getPublishedYear(metadata); // issue: 10.1021/ci00024a006 gives back 2005, though it was published in 1995 (legacy archives)

	// books may not have volumes (10.1007/0-306-48639-3_12)
	if (volume) {
		output += ",** *" + volume;
		output += (issue ? "* (" + issue + ")" : "*,") + (page ? (issue ? "," : "") : "");
	}
	console.log(output);
	// page numbers are absent in ACS Article ASAP service or some other papers (10.1371/journal.pone.0068486)
	if (page) output += (volume ? " " : ",** ") + getPageRange(page);
	console.log(output);
	if (!page && !volume) output += "**";

	return output;
}

function getPublishedYear(metadata) {
	// the last two are not always accurate (github.com/CrossRef/rest-api-doc/issues/381)
	var usableDateParts = metadata["published-print"] || metadata["published-online"] || metadata["created"];

	return usableDateParts["date-parts"][0][0];
}

function getShortJournalTitle(metadata) {
	// user needs to install this via a GitHub Gist
	var title = metadata["container-title"],
		shortTitle = metadata["short-container-title"];

	// fallback to sometimes inaccurate CrossRef results in case user didn't install Gist
	// (eg: missing the short-container-title field (10.1023/A:1008989800098); incorrect short form (Tetrahedron Letters instead of Tetrahedron Lett.)

	// fallback to unabbrev. title in case neither list has the abbrev., or in case it's a book (not a journal - 10.1007/0-306-48639-3_12)
	return (chse.journalList && chse.journalList[title]) || (shortTitle.length !== 0 ? shortTitle[0] : title);
}

/**
 * names like William von leu should be capitalized to
 * William von Leu
 * @param {String} name family name of an author
 */
function capitalizeSpecialAuthorFamilyNames(name) {
	return name.replace(/von ([a-z])/, function($0, $1) {
		return "von " + $1.toUpperCase();
	});
}

function citeAuthors(authors) {
	// there needn't be authors all the time; (10.1007/0-306-48639-3_12)
	if (!authors || authors.length === 0) return "";

	var citation = "",
		familyName;
	for (var i = 0, len = authors.length; i < len; i++) {
		familyName = authors[i].family;
		// ex: https://journals.aps.org/prx/abstract/10.1103/PhysRevX.7.031059
		// last entry is not an author actually
		if (!familyName) continue;

		// 10.1248/cpb.49.1102 has all its author names in ALL CAPS; capitalize its only first letter
		citation +=
			capitalizeSpecialAuthorFamilyNames(chse.capitalizeFirstLetter(familyName)) +
			"," +
			getInitials(authors[i].given);
		citation += "; ";
	}

	// final two characters ("; ") are unnecessary
	var strLen = citation.length;
	citation = citation.substring(0, strLen - 2) + " ";

	return citation;
}

function getInitials(givenName) {
	return givenName.split(" ").reduce((citation, name) => citation + " " + name[0] + ".", "");
}

function citeTitle(title) {
	// some titles are received in ALL CAPS (10.1021/ja01532a066)
	// fix them to titlecase
	if (chse.isAllUpcase(title)) title = chse.toTitleCase(title);

	// some paper titles don't end with punctuation
	// example: 10.1021/ci00024a006, 10.1021/ja00178a014
	if (!chse.endsWithPunctuation(title)) title += ".";

	// some paper titles have a phrase like (iii)
	// correct it to (III) (ex: 10.1039/C5SC03429A)
	title = title.replace(/\((i+)\)/, function($0, $1) {
		return "(" + $1.toUpperCase() + ")";
	});

	return title;
}

function getPageRange(pages) {
	return pages.replace(/[-]/, "–");
}

// general DOI format: http://www.doi.org/doi_handbook/2_Numbering.html#2.2.2
/*
The following web URLs are being checked: (they follow the format specified here https://webhome.weizmann.ac.il/home/comartin/doi.html)
- Wiley - https://onlinelibrary.wiley.com/doi/pdf/10.1002/9780470682531.pat0081
- Springer Verlag - https://link.springer.com/article/10.1007%2Fs002140050256
- Elsevier (ScienceDirect) - https://www.sciencedirect.com/science/article/pii/S0013468602000476
- ACS - https://pubs.acs.org/doi/abs/10.1021/ed029p167
- Nature - https://www.nature.com/articles/s41586-018-0058-6
- RSC - http://pubs.rsc.org/en/content/articlelanding/2011/dt/c0dt01244k/unauth#!divAbstract

The following websites are unsupported:
- American Press IDEAL (10.1006) (absorbed by Elsevier; web URLs non existent; DOIs still work)
- Cambridge UP - https://www.cambridge.org/core/journals/ageing-and-society/article/social-engagement-from-childhood-to-middle-age-and-the-effect-of-childhood-socioeconomic-status-on-middle-age-social-engagement-results-from-the-national-child-development-study/2512DF65E696B95F028BF9209A9FD2DA#
 can anyone tell how to extract DOI from this URL?! --^
 -  i can work on these later
 10.1046 Blackwell Publishers. Details to follow.
10.1055 G. Thieme Verlag (Synthesis).Structure: s-YEAR-XXXXX, where XXXXX is a 5-digit article code.
10.1063 American Institute of Physics. The DOI of recent articles (example: http://dx.doi.org/10.1063/1.1385363) can be found on the online abstract of the paper. However, AIP offers a very convenient alternative (a kind-of "OpenURL avant-la-lettre"): http://link.aip.org/link/?jou/vol/firstpage, where "jou" is the three-letter journal abbreviation (e.g. jcp for Journal of Chemical Physics), "vol" is the volume number and "firstpage" the first page number. Example: http://link.aip.org/link/?jcp/115/2051 will link to J. Chem. Phys. 115, 2051 (2001).
10.1073 PNAS (Proceedings of the National Academy of Sciences [USA]). pnas.XXXXXXXXX, where XXXXXXXXX is a 9-digit manuscript number.
10.1074 Journal of Biological Chemistry. Structure: jbc.MXXXXXXXXX, where XXXXXXXXX is a 9-digit manuscript number.
10.1080 Taylor and Francis. This publisher uses 15-character PIIs like Elsevier; again, the PII can generally be found on the online abstract of the journal paper or on the first page of the printed paper. An example DOI URL is http://dx.doi.org/10.1080/002689799163172
10.1083 Rockefeller University Press (e.g. Journal of Cell Biology)
10.1092 Laser Pages Publishing (=Israel Journal of [fill in subject]). Structure: e.g. V0Q8-T3XM-N68W-D8NL.
10.1093 Oxford University Press, EMBO (European Molecular Biology Organisation). Structure: emboj/aaaXXX, where emboj stands for EMBO Journal and aaaXXX is a 3-letter, 3-digit article code.
10.1103 American Physical Society. Example: http://dx.doi.org/10.1103/PhysRevA.68.021801. As you see, JournalName.Volume.ArticleNumber. Like for AIP, an alternative URL is given as follows: http://link.aps.org/abstract/PRA/v68/e021801.
10.1107 International Union of Crystallography (e.g. Acta Crystallographica series). Uses PIIs in same way as Elsevier (see above).
10.1126 SCIENCE magazine. Structure: science.XXXXXXX, where XXXXXXX is a 7-digit article code.
10.1161 American Heart Association.
10.1182 American Society of hematology (e.g. the journal Bloo
 */
function getDOIFromPaperWebURL(originalURL) {
	// remove query parameters
	var queryMatch = originalURL.match(/[\?#]/),
		URL = originalURL;
	if (queryMatch) URL = URL.substring(0, queryMatch.index);

	if (/wiley|journals.aps.org/.test(URL)) {
		return URL.match(/10\.\d+(\.\d+)?\/.+/)[0];
	} else if (/springer/.test(URL)) {
		var matcher = URL.match(/(10\.\d+(\.\d+)*?)(%2F | \/)?(.+)/i);
		return matcher[1] + (matcher[3] || "/") + matcher[4];
	} else if (/sciencedirect/.test(URL)) {
		var PII = URL.match(/pii\/(.+)\/?/i)[1],
			sPresent = /pii\/s/i.test(URL),
			doi = sPresent ? "S" : "";

		// the doi substring logic below requires the S to be removed if present
		if (sPresent) PII = PII.substring(1);

		// PII has to be split like "Sxxxx-xxxx(yy)zzzzz-c" (S can be upcase/lowercase/absent altogether)
		doi +=
			PII.substring(0, 4) +
			"-" +
			PII.substring(4, 8) +
			"(" +
			PII.substring(8, 10) +
			")" +
			PII.substring(10, 15) +
			"-" +
			PII.substring(15, 16);

		return "10.1016/" + doi;
	} else if (/acs/.test(URL)) {
		return URL.match(/10\.\d+(\.\d+)?\/.+/)[0];
	} else if (/nature/.test(URL)) {
		return "10.1038/" + URL.match(/\/(s.+)/)[1];
	} else if (/rsc/.test(URL)) {
		// rsc url may not always have unauth at its end
		return "10.1039/" + (URL.match(/\/([\w]+)\/unAuth$/i) || URL.match(/\/([\w]+)$/))[1];
	} else if (/plos/.test(URL)) {
		// http://journals.plos.org/plosone/article?id=10.1371/journal.pone.0068486
		// the id? query parameter gets stripped away in the URL
		return "10.1371/journal.pone." + originalURL.match(/pone\.(\d+)/)[1];
	}

	return null;
}

chse.getURISource = function(URI) {
	// URIs supported: "website"/"doi"/"paperWeb"
	// "website" is any website like HyperPhysics
	// "doi" is literally a DOI url
	// "paperWeb" is a wiley/elsevier/nature/etc. URL

	URI = URI.trim();

	var validDOIRegexes = [
		/^DOI: ?(10\.\d+\/.+)$/i,
		/^(10\.\d+\/.+)$/i,
		/^(https?:?\/?\/?)?(dx.)?doi.org\/(10\.\d+\/.+)$/i
	];

	for (var doiRegex, i = 0, len = validDOIRegexes.length; i < len; i++) {
		doiRegex = validDOIRegexes[i];
		var match = URI.match(doiRegex);
		if (match) {
			return ["doi", match[match.length - 1]];
		}
	}

	var DOI = getDOIFromPaperWebURL(URI);
	if (DOI) return ["paperWeb", DOI];

	var validWebsiteRegexes = [/^(https?:\/?\/?)?(www\.)?[\w\.]+?\.[a-z]+[\w\d\.\/]*$/];
	// port://www.completeDomain/path
	for (var webRegex, j = 0, l = validWebsiteRegexes.length; j < l; j++) {
		webRegex = validWebsiteRegexes[j];
		if (webRegex.test(URI)) return ["web", URI];
	}

	return [null, null];
};

chse.debugLog("Get citation loaded");
