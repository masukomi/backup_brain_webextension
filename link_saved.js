console.log(`XXX Link saved! gonna close ${document.location.toString()}`)
browser.runtime.sendMessage({event: 'link_saved'})
                // "*://*/*?closeable*",
                // "*://*/*?closeable=true*",
                // "*://*/*success*",
                // "*://*/*success?*",
                // "*://*/*/success*",
                // "*://*/*/success?*",
                // "*://*/bookmarks/success*",
                // "*://*/bookmarks/success?*"
