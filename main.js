/* Hello fellow Geek.
As you go through this file you may notice a lot
of commented out code.
BackupBrain doesn't currently support these features
but I hope to in the future.
*/
import {Preferences} from './preferences.js'
const BackupBrain = {
    url: {
        add_link: '{backup_brain_url}/bookmarks/new?showtags={show_tags}&url={url}&title={title}&description={description}&closeable=true&layout=webextension',
        unread_link: '{backup_brain_url}/bookmarks/to_read',


        // read_later: '{backup_brain_url}/create?to_read=true&noui=yes&jump=close&url={url}&title={title}',
        // save_tabs: '{backup_brain_url}/tabs/save/',
        // show_tabs: '{backup_brain_url}/tabs/show/',
        login: '{backup_brain_url}/popup_login/'
    },

    async get_endpoint(url_handle, bookmark_info) {

        const backup_brain_url = await Preferences.get('backup_brain_url')
        if (! backup_brain_url) {
            return "https://backupbrain.app/configure_your_extension"

        } else {
            const url_template = this.url[url_handle]
            const show_tags = await Preferences.get('show_tags')
            let endpoint = url_template.replace('{show_tags}', show_tags)
            if (bookmark_info) {
                endpoint = endpoint.replace('{url}', encodeURIComponent(bookmark_info.url || ''))
                    .replace('{title}', encodeURIComponent(bookmark_info.title || ''))
                    .replace('{description}', encodeURIComponent(bookmark_info.description || ''))

            }
            return endpoint
                .replace('{backup_brain_url}', backup_brain_url)
        }
    }
}

const App = {
    toolbar_button_state: Preferences.defaults.toolbar_button,

    // Returns the original URL for a page opened in Firefox's reader mode
    async stripReaderModeUrl(url) {
        if (url.indexOf('about:reader?url=') == 0) {
            url = decodeURIComponent(url.substr(17))
        }
        return url
    },

    async getCurrentTab() {
        let queryOptions = { active: true, lastFocusedWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);
        return tab;
    },

    async getDescription(tab_id) {
        // const data = await chrome.runtime.sendMessage({event: 'bb_get_description'}, response => {})
        //const data = await chrome.runtime.sendMessage({event: 'bb_get_description'})

        const response = await chrome.tabs.sendMessage(
            tab_id, {method: 'bbGetDescription'}
        );
        let description = response.data
        if (description === undefined || description == null) {
            description = ""
        }
        return description
    },

    async getBookmarkInfoFromCurrentTab() {
        // const tabs = await chrome.tabs.query({currentWindow: true, active: true})
        const current_tab = await this.getCurrentTab()
        const description = await this.getDescription(current_tab.id)
        const info = {
            url: await this.stripReaderModeUrl(current_tab.url),
            title: current_tab.title,
            description: description
        }
        return info
    },

    async get_bookmark_info_from_context_menu_target(info, tab) {
        let url
        let title = ''

        if (info.linkUrl) {
            url = info.linkUrl
            if (info.linkText) {
                title = info.linkText.substr(0, 200)
                if (title.length < info.linkText.length) {
                    title += '...'
                }
            }
        } else {
            url = info.pageUrl
            title = tab.title
        }

        return {
            url: await this.stripReaderModeUrl(url),
            title: title,
            description: info.selectionText || ''
        }
    },

    async calculateAndOpenRoot() {

        const backup_brain_url = await Preferences.get('backup_brain_url');
        if (backup_brain_url === undefined || backup_brain_url == '' || backup_brain_url == null) {
            this.open_dynamic_url_in_tab("https://BackupBrain.app")
        } else {
            this.open_dynamic_url_in_tab(backup_brain_url)
        }

    },

    // Opens a window for interacting with BackupBrain
    async openAddLinkWindow(url) {
        const bg_window = await chrome.windows.getCurrent()
        // someday we'll show tags. Someday…
        const show_tags = await Preferences.get('show_tags')
        const add_bookmark_form = await chrome.windows.create({
            url: url,
            type: 'popup',
            width: 1500,
            height: show_tags ? 550 : 350,
            incognito: bg_window.incognito
        })
        return add_bookmark_form
    },

    // Open the Add Link form in a new tab
    async open_add_link_tab(url) {
        open_dynamic_url_in_tab(url)
    },

    async open_dynamic_url_in_tab(url) {
        const active_tabs = await chrome.tabs.query({currentWindow: true, active: true})
        const opener_tab = active_tabs[0]
        const new_tab = await chrome.tabs.create({
            url: url,
            openerTabId: opener_tab.id
        })
        return new_tab
    },

    // Opens the BackupBrain "Add Link" form
    async openSaveForm(bookmark_info) {
        const endpoint = await BackupBrain.get_endpoint('add_link', bookmark_info)
        const add_link_form_in_tab = await Preferences.get('add_link_form_in_tab')
        if (add_link_form_in_tab) {
            const tab = await this.open_add_link_tab(endpoint)
            this.close_save_form = async () => {
                await chrome.tabs.remove(tab.id)
            }
        } else {

            const win = await this.openAddLinkWindow(endpoint)
            this.close_save_form = async () => {
                await chrome.windows.remove(win.id)
            }
        }
    },

    async close_save_form() {
        throw 'No close function defined.'
    },


    async show_notification(message, force) {
        const show_notifications = true; // await Preferences.get('show_notifications')
        if (force || show_notifications) {
            chrome.notifications.create({
                'type': 'basic',
                'title': 'BackupBrain',
                'message': message,
                'iconUrl': 'icons/backup_brain_icon_48.png'
            })
        }
    },

    async showMenu(){
        let readyToGo = await handleInstalled()
        if (readyToGo) {
            chrome.action.setPopup({popup: 'popup_menu.html'})
            chrome.action.setTitle({title: 'Add to Backup Brain'})
        }
    },
    async saveDialog(){
        let readyToGo = await handleInstalled()
        if (readyToGo) {
            chrome.action.setPopup({popup: ''})
            chrome.action.setTitle({title: 'Add to BackupBrain'})
        }

    },


    async update_toolbar_button() {
        const pref = await Preferences.get('toolbar_button')
        if (pref != this.toolbar_button_state) {
            switch (pref) {

                case 'show_menu':
                    showMenu()
                    break

                case 'save_dialog':
                    saveDialog()
                    break
                /*
                case 'read_later':
                    chrome.action.setPopup({popup: ''})
                    chrome.action.setTitle({title: 'Add to BackupBrain (read later)'})
                    break
                */
            }
            this.toolbar_button_state = pref
        }
    },

    async update_context_menu() {
        const add_context_menu_items = await Preferences.get('context_menu_items')
        if (add_context_menu_items) {
            chrome.contextMenus.create({
                id: 'save_dialog',
                title: 'Save...',
                contexts: ['link', 'page', 'selection']
            })
            /*
            chrome.contextMenus.create({
                id: 'read_later',
                title: 'Read later',
                contexts: ['link', 'page', 'selection']
            })
            chrome.contextMenus.create({
                id: 'save_tab_set',
                title: 'Save tab set...',
                contexts: ['page', 'selection']
            })
            */
        } else {
            chrome.contextMenus.removeAll()
        }
    },

    async check_page_loaded(url) {
        if (url.match(/\/bookmarks\/success\?closeable=true/)) {
            this.show_notification('bookmark saved!')
            setTimeout(this.close_save_form, 4)
        }
    },

    async handle_message(message, url) {
        let bookmark_info
        switch (message) {
            case 'save_dialog':
                bookmark_info = await this.getBookmarkInfoFromCurrentTab()
                this.openSaveForm(bookmark_info)
                break

            case 'unread':
                const unread_link = await BackupBrain.get_endpoint('unread_link')
                this.open_dynamic_url_in_tab(unread_link)
                break
            case 'root_link':
                this.calculateAndOpenRoot()
                break
            case 'has_url':
                this.handleInstalled()
                break

            /*
            case 'read_later':
                bookmark_info = await this.getBookmarkInfoFromCurrentTab()
                this.save_for_later(bookmark_info)
                break

            case 'save_tab_set':
                this.save_tab_set()
                break
            */

            case 'page_loaded':
                this.check_page_loaded(url)
                break
        }
    },

    async handle_context_menu(info, tab) {
        let bookmark_info
        switch (info.menuItemId) {
            case 'save_dialog':
                bookmark_info = await this.get_bookmark_info_from_context_menu_target(info, tab)
                this.openSaveForm(bookmark_info)
                break

            /*
            case 'read_later':
                bookmark_info = await this.get_bookmark_info_from_context_menu_target(info, tab)
                this.save_for_later(bookmark_info)
                break

            case 'save_tab_set':
                this.save_tab_set()
                break
            */
        }
    },

    async handle_preferences_changes(changes, area) {
        if (area !== Preferences.storage_area) {
            return
        }
        const key = Object.keys(changes).pop()
        switch (key) {
            case 'toolbar_button':
                this.update_toolbar_button()
                break
            case 'context_menu_items':
                this.update_context_menu()
                break
        }
    },

    async handleInstalled(details) {
        /* note: details.reason is one of: 'install', 'update', 'browser_update',  'shared_module_update'
         * ⚠ On Chrome "browser_update" is "chrome_update"
         * Docs here: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/OnInstalledReason
         */
        const bbu = await Preferences.get('backup_brain_url')

        if (! bbu) {
            // chrome.tabs.create({url: 'post_install.html'})
            this.show_notification('I need to know where your Backup Brain server is. Please configure me.', true)
            await chrome.runtime.openOptionsPage()
            return false
        }
        return true
    }
}

// Attach message event handler
chrome.runtime.onMessage.addListener(message => {
    App.handle_message(message.event, message.url)
})

// Toolbar button event handler
chrome.action.onClicked.addListener(() => {
    App.handle_message(App.toolbar_button_state)
})

// Keyboard shortcut event handler
chrome.commands.onCommand.addListener(command => {App.handle_message(command)})

// Context menu event handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    App.handle_context_menu(info, tab)
})

// Preferences event handler
chrome.storage.onChanged.addListener((changes, area) => {App.handle_preferences_changes(changes, area)})

// Version update listener
chrome.runtime.onInstalled.addListener(details => {App.handleInstalled(details)})

// Apply preferences when loading extension
App.update_toolbar_button()
App.update_context_menu()

