/* main.js isn't allowed to query the page for selected text
 * but this file is injected into every page, so it can
 */
chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
    if (message.method == 'bbGetDescription') {
      var description = window.getSelection().toString();
      sendResponse({data: description});
    }
  }
);
