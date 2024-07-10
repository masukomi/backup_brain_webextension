/* Hello fellow Geek.
As you go through this file you may notice a lot
of commented out code.
BackupBrain doesn't currently support these features
but I hope to in the future.
*/

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
        const backup_brain_url = await Preferences.get('backup_brain_url');
        if (backup_brain_url === undefined || backup_brain_url == '' || backup_brain_url == null) {
            return "https://backupbrain.app/configure_your_extension/"

        } else {
            const url_template = this.url[url_handle]
            const show_tags = await Preferences.get('show_tags') ? 'yes' : 'no'
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
    async strip_reader_mode_url(url) {
        if (url.indexOf('about:reader?url=') == 0) {
            url = decodeURIComponent(url.substr(17))
        }
        return url
    },

    async get_bookmark_info_from_current_tab() {
        const tabs = await browser.tabs.query({currentWindow: true, active: true})
        const info = {
            url: await this.strip_reader_mode_url(tabs[0].url),
            title: tabs[0].title
        }
        try {
            info.description = await browser.tabs.executeScript({code: 'getSelection().toString()'})
        } catch (error) {
            info.description = ''
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
            url: await this.strip_reader_mode_url(url),
            title: title,
            description: info.selectionText || ''
        }
    },

    async calculate_and_open_root() {

        const backup_brain_url = await Preferences.get('backup_brain_url');
        if (backup_brain_url === undefined || backup_brain_url == '' || backup_brain_url == null) {
            this.open_dynamic_url_in_tab("https://BackupBrain.app")
        } else {
            this.open_dynamic_url_in_tab(backup_brain_url)
        }

    },

    // Opens a window for interacting with BackupBrain
    async open_add_link_window(url) {
        const show_tags = await Preferences.get('show_tags')
        const bg_window = await browser.windows.getCurrent()
        const pin_window = await browser.windows.create({
            url: url,
            type: 'popup',
            width: 800,
            height: show_tags ? 550 : 350,
            incognito: bg_window.incognito
        })
        return pin_window
    },

    // Open the Add Link form in a new tab
    async open_add_link_tab(url) {
        open_dynamic_url_in_tab(url)
    },

    async open_dynamic_url_in_tab(url) {
        const active_tabs = await browser.tabs.query({currentWindow: true, active: true})
        const opener_tab = active_tabs[0]
        const new_tab = await browser.tabs.create({
            url: url,
            openerTabId: opener_tab.id
        })
        return new_tab
    },

    // Opens the BackupBrain "Add Link" form
    async open_save_form(bookmark_info) {
        const endpoint = await BackupBrain.get_endpoint('add_link', bookmark_info)
        const add_link_form_in_tab = await Preferences.get('add_link_form_in_tab')
        if (add_link_form_in_tab) {
            const tab = await this.open_add_link_tab(endpoint)
            this.close_save_form = async () => {
                await browser.tabs.remove(tab.id)
            }
        } else {
            const win = await this.open_add_link_window(endpoint)
            this.close_save_form = async () => {
                await browser.windows.remove(win.id)
            }
        }
    },

    async close_save_form() {
        throw 'No close function defined.'
    },

    // Saves the bookmark to read later
    /*
    async save_for_later(bookmark_info) {
        const endpoint = await BackupBrain.get_endpoint('read_later', bookmark_info)
        const bg_window = await browser.windows.getCurrent()
        if (bg_window.incognito) {

            // In private mode we actually have to open a window,
            // because Firefox doesn't support split incognito mode
            // and gets confused about cookie jars.
            this.open_save_form(endpoint)

        } else {

            const http_response = await fetch(endpoint, {credentials: 'include'})
            if (http_response.redirected && http_response.url.startsWith(await BackupBrain.get_endpoint('login'))) {
                this.open_save_form(http_response.url)
            } else if (http_response.status !== 200 || http_response.ok !== true) {
                this.show_notification('FAILED TO ADD LINK. ARE YOU LOGGED-IN?', true)
            } else {
                this.show_notification('Saved to read later.')
            }

        }
    },
    */
    /*
    async save_tab_set() {
        const bg_window = browser.windows.getCurrent()
        if (bg_window.incognito) {
            this.show_notification("Due to a Firefox limitation, saving tab sets does not work in Private mode. Try normal mode!", true)
            return
        }

        const window_info = await browser.windows.getAll({populate: true, windowTypes: ['normal']})
        let windows = []
        for (let i = 0; i < window_info.length; i++) {
            const current_window_tabs = window_info[i].tabs
            let tabs = []
            for (let j = 0; j < current_window_tabs.length; j++) {
                tabs.push({
                    title: current_window_tabs[j].title,
                    url: await this.strip_reader_mode_url(current_window_tabs[j].url)
                })
            }
            windows.push(tabs)
        }

        let payload = new FormData()
        payload.append('data', JSON.stringify({browser: 'ffox', windows: windows}))
        const http_response = await fetch(await BackupBrain.get_endpoint('save_tabs'), {method: 'POST', body: payload, credentials: 'include'})
        if (http_response.status !== 200 || http_response.ok !== true) {
            this.show_notification('FAILED TO SAVE TAB SET.', true)
        } else {
            browser.tabs.create({url: await BackupBrain.get_endpoint('show_tabs')})
        }
    },
    */

    async show_notification(message, force) {
        const show_notifications = await Preferences.get('show_notifications')
        if (force || show_notifications) {
            browser.notifications.create({
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
            browser.browserAction.setPopup({popup: 'popup_menu.html'})
            browser.browserAction.setTitle({title: 'Add to Backup Brain'})
        }
    },
    async saveDialog(){
        let readyToGo = await handleInstalled()
        if (readyToGo) {
            browser.browserAction.setPopup({popup: ''})
            browser.browserAction.setTitle({title: 'Add to BackupBrain'})
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
                    browser.browserAction.setPopup({popup: ''})
                    browser.browserAction.setTitle({title: 'Add to BackupBrain (read later)'})
                    break
                */
            }
            this.toolbar_button_state = pref
        }
    },

    async update_context_menu() {
        const add_context_menu_items = await Preferences.get('context_menu_items')
        if (add_context_menu_items) {
            browser.contextMenus.create({
                id: 'save_dialog',
                title: 'Save...',
                contexts: ['link', 'page', 'selection']
            })
            /*
            browser.contextMenus.create({
                id: 'read_later',
                title: 'Read later',
                contexts: ['link', 'page', 'selection']
            })
            browser.contextMenus.create({
                id: 'save_tab_set',
                title: 'Save tab set...',
                contexts: ['page', 'selection']
            })
            */
        } else {
            browser.contextMenus.removeAll()
        }
    },

    async check_page_loaded(url) {
        if (url.match(/\/bookmarks\/success\?closeable=true/)) {
            this.show_notification('bookmark saved!')
            setTimeout(this.close_save_form(), 4) // milliseconds
        }
    },

    async handle_message(message, url) {
        let bookmark_info
        switch (message) {
            case 'save_dialog':
                bookmark_info = await this.get_bookmark_info_from_current_tab()
                this.open_save_form(bookmark_info)
                break

            case 'unread':
                const unread_link = await BackupBrain.get_endpoint('unread_link')
                this.open_dynamic_url_in_tab(unread_link)
                break
            case 'root_link':
                this.calculate_and_open_root()
                break
            case 'has_url':
                this.handleInstalled()
                break

            /*
            case 'read_later':
                bookmark_info = await this.get_bookmark_info_from_current_tab()
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
                this.open_save_form(bookmark_info)
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
        if (bbu === undefined || bbu == '' || bbu == null) {
            // browser.tabs.create({url: 'post_install.html'})
            this.show_notification('I need to know where your Backup Brain server is. Please configure me.', true)
            await browser.runtime.openOptionsPage()
            return false
        }
        return true
    }
}

// Attach message event handler
browser.runtime.onMessage.addListener(message => {
    App.handle_message(message.event, message.url)
})

// Toolbar button event handler
browser.browserAction.onClicked.addListener(() => {
    App.handle_message(App.toolbar_button_state)
})

// Keyboard shortcut event handler
browser.commands.onCommand.addListener(command => {App.handle_message(command)})

// Context menu event handler
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    App.handle_context_menu(info, tab)
})

// Preferences event handler
browser.storage.onChanged.addListener((changes, area) => {App.handle_preferences_changes(changes, area)})

// Version update listener
browser.runtime.onInstalled.addListener(details => {App.handleInstalled(details)})

// Apply preferences when loading extension
App.update_toolbar_button()
App.update_context_menu()

