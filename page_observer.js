new MutationObserver(() => {
    chrome.runtime.sendMessage({event: 'page_loaded', url: location.href})
}).observe(document, {subtree: true, childList: true});

