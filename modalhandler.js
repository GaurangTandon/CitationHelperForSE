/* global chse */
var DOI_BOX_CLASS = "doi-box";

if (!localStorage.getItem(LS_KEY)) localStorage.setItem(LS_KEY, "{}");

(function() {
	(function handleModals() {
		var PLACEHOLDER = "reference (DOI/URL/plain text)";

		function addButton(ul) {
			var li = document.createElement("LI"),
				// different userscripts insert their own elements into the mix
				// so make sure to insert just after the redo button for consistency
				lastChild = ul.querySelector("li[id^=wmd-redo-button]").nextElementSibling;

			ul.insertBefore(li, lastChild);

			li.className = "wmd-button wmd-doi tmAdded";
			// tmAdded required when also running this userscript https://github.com/BrockA/SE-misc
			li.innerHTML = "<span>doi</span>";
			li.title = "insert doi";

			li.onclick = function() {
				toggleModal(ul.parentElement);
			};

			return li;
		}

		function createModal(container) {
			var div = document.createElement("div"),
				input = document.createElement("input"),
				shortBtn = document.createElement("button"),
				longBtn = document.createElement("button");

			div.classList.add(DOI_BOX_CLASS);

			input.type = "text";
			input.className = "awesomplete";
			input.setAttribute("placeholder", PLACEHOLDER);
			input.onkeydown = function(e) {
				if (e.keyCode === 13) {
					e.preventDefault();
					e.stopPropagation();
					console.log("I tried!");
					return false;
				}
			};

			shortBtn.innerHTML = "Short";
			longBtn.innerHTML = "Long";

			function commonInsertCitation(type) {
				var fn = type === 1 ? insertShortCitation : insertLongCitation;

				return function(e) {
					e.preventDefault();
					TYPE = type;

					var val = input.value,
						source = getSource(val);

					switch (source[0]) {
						case "doi":
						case "paperWeb":
							citeDOI(source[1], function(citation) {
								fn(container, citation);
							});
							break;
						case "web":
							citeWebsite(val, function(citation) {
								fn(container, citation);
							});
							// it is not a DOI and there is no need to cache it (because it isn't fetched via an XHR)
							// but adding it to the localStorage list helps autocomplete it later
							// (think of a person referencing Vogel multiple times)
							cacheDOI(val, val);
							break;
						// alternate of Manual citation
						default:
							cacheDOI(val, val);
							fn(container, val);
					}
				};
			}

			shortBtn.onclick = commonInsertCitation(1);
			longBtn.onclick = commonInsertCitation(2);

			div.appendChild(input);
			div.appendChild(shortBtn);
			div.appendChild(longBtn);

			return div;
		}

		function insertShortCitation(container, citation) {
			var textarea = container.parentNode.querySelector("textarea"),
				selS = textarea.selectionStart,
				selE = textarea.selectionEnd,
				value = textarea.value,
				valBefore = value.substring(0, selS),
				valMid = value.substring(selS, selE),
				valAfter = value.substring(selE);

			textarea.value = valBefore + citation + valAfter;
			textarea.selectionStart = textarea.selectionEnd = (valBefore + citation).length;
			toggleModal(container);
			textarea.focus();

			// couldn't find the documentation for this, but it works ---v
			// (widely used https://github.com/search?q=refreshAllPreviews&type=Code)
			StackExchange.MarkdownEditor.refreshAllPreviews();
		}

		function getCurrentReferenceCount(value) {
			var match = value.match(/Reference(.|\n)+(\d)\. [a-zA-Z]/);
			// without the ` [a-zA-Z]`, this match also extends to even digits inside DOI URLs

			if (!match) return 0;
			else return +match[2];
		}

		function insertLongCitation(container, citation) {
			var textarea = container.parentNode.querySelector("textarea"),
				selS = textarea.selectionStart,
				selE = textarea.selectionEnd,
				value = textarea.value,
				currRefCount = getCurrentReferenceCount(value),
				superscriptedCite = "<sup>\\[" + (currRefCount + 1) + "\\]</sup>",
				valBefore = value.substring(0, selS),
				valMid = value.substring(selS, selE),
				valAfter = value.substring(selE);

			value = valBefore + superscriptedCite + valAfter;

			if (currRefCount === 0) {
				value += "\n### References:\n\n1. " + citation;
				textarea.value = value;
			} else {
				var position = value.match(/Reference(.|\n)+\d\..+(\n|$)/),
					startOfReferences = position.index,
					lastReferenceNewline = startOfReferences + position[0].length,
					textBeforeLastRefNewLine = value.substring(0, lastReferenceNewline),
					textAfterLastRefNewLine = value.substring(lastReferenceNewline),
					valToInsert = "\n" + (currRefCount + 1) + ". " + citation + "\n",
					newValue = textBeforeLastRefNewLine + valToInsert + textAfterLastRefNewLine;

				textarea.value = newValue;
			}

			textarea.selectionStart = textarea.selectionEnd = (valBefore + superscriptedCite).length;
			toggleModal(container);
			textarea.focus();
			StackExchange.MarkdownEditor.refreshAllPreviews();
		}

		function toggleModal(container) {
			var div = container.querySelector("." + DOI_BOX_CLASS),
				input = div.querySelector("input");

			if (div.classList.contains("shown")) {
				div.classList.remove("shown");
			} else {
				div.classList.add("shown");
				input.value = "";
				input.focus();
			}

			console.trace();
		}

		var cachedKeys = Object.keys(JSON.parse(localStorage.getItem(LS_KEY)));

		setInterval(function() {
			var cont = document.querySelector(".wmd-container:not(.doi-processed)"),
				ul,
				div,
				buttonBar,
				input;

			if (cont && (ul = cont.querySelector(".wmd-button-bar ul"))) {
				addButton(ul);
				cont.classList.add("doi-processed");

				buttonBar = cont.querySelector("div[id^=wmd-button-bar]");

				div = createModal(buttonBar);
				buttonBar.appendChild(div);

				// only call the constructor after the input element
				// is inside the DOM
				input = div.querySelector("input");
				input.dataset.minchars = 1;
				input.dataset.maxitems = 5;
				input.dataset.autofirst = true;

				new Awesomplete(input, {
					list: cachedKeys
				});
			}
		}, 500);

		// there's no way to automatically read a clipboard content
		// think of some other UI
		// https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
	})();
})();

var styleEl = document.createElement("style"),
	cssToUse = `
/**https://cdnjs.com/libraries/awesomplete*/
.awesomplete [hidden]{display:none}.awesomplete .visually-hidden{position:absolute;clip:rect(0,0,0,0)}.awesomplete{display:inline-block;position:relative}.awesomplete>input{display:block}.awesomplete>ul{position:absolute;left:0;z-index:1;min-width:100%;box-sizing:border-box;list-style:none;padding:0;border-radius:.3em;margin:.2em 0 0;background:hsla(0,0%,100%,.9);background:linear-gradient(to bottom right,#fff,hsla(0,0%,100%,.8));border:1px solid rgba(0,0,0,.3);box-shadow:.05em .2em .6em rgba(0,0,0,.2);text-shadow:none}.awesomplete>ul:empty{display:none}@supports (transform:scale(0)){.awesomplete>ul{transition:.3s cubic-bezier(.4,.2,.5,1.4);transform-origin:1.43em -.43em}.awesomplete>ul:empty,.awesomplete>ul[hidden]{opacity:0;transform:scale(0);display:block;transition-timing-function:ease}}.awesomplete>ul:before{content:"";position:absolute;top:-.43em;left:1em;width:0;height:0;padding:.4em;background:#fff;border:inherit;border-right:0;border-bottom:0;-webkit-transform:rotate(45deg);transform:rotate(45deg)}.awesomplete>ul>li{position:relative;padding:.2em .5em;cursor:pointer}.awesomplete>ul>li:hover{background:#b7d2e0;color:#000}.awesomplete>ul>li[aria-selected=true]{background:#3d6c8e;color:#fff}.awesomplete mark{background:#e9ff00}.awesomplete li:hover mark{background:#b5d100}.awesomplete li[aria-selected=true] mark{background:#3c6b00;color:inherit}

.awesomplete{
    position: inherit !important;
    /* required to keep the input element hidden while modal is collapsed*/
}

.${DOI_BOX_CLASS}{
    transition: 0.25s ease;
    height: 0px;
}

.${DOI_BOX_CLASS} input{
    display: inline-block;
    width: 500px;
    font-size: 14px;
    padding: 8px;
    position: inherit;
}

.${DOI_BOX_CLASS}.shown {
     height: 45px;
}

.${DOI_BOX_CLASS} button{
    position: inherit; /*allows buttons to flow in and out*/
    margin: 5px;
}
`;
styleEl.setAttribute("type", "text/css");
styleEl.textContent = cssToUse;
document.head.appendChild(styleEl);
