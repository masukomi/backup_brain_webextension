new MutationObserver(() => {
    chrome.runtime.sendMessage({event: 'bb_page_loaded', url: location.href})
}).observe(document, {subtree: true, childList: true});

