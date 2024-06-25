console.log("XXX loaded page_observer.js")

new MutationObserver(() => {
    chrome.runtime.sendMessage({event: 'page_loaded', url: location.href})
}).observe(document, {subtree: true, childList: true});

