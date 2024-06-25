export const Preferences = {


    defaults: {
        backup_brain_url: null,
        // all of the rest of these were
        // stripped out of the UI but will,
        // hopefully be added back in.
        toolbar_button: 'show_menu',
        show_notifications: true,
        context_menu_items: true,
        show_tags: true,
        add_link_form_in_tab: false
    },

    async get(option) {
        // see the following for Storage Area APIs
        //  https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea
        let stored_value = await chrome.storage.sync.get(option)
        if (! stored_value[option]) {
            stored_value[option] = this.defaults[option]
        }

        return stored_value[option]
    },

    async set(option, value) {
        let option_value = {}
        if (option == "backup_brain_url" && value.match(/\/$/)) {
            value = value.replace(/\/$/, '')
        }
        option_value[option] = value
        chrome.storage.local.set(option_value)
    },

    async get_keyboard_shortcuts() {
        const shortcuts = await chrome.commands.getAll()
        return shortcuts.filter(shortcut => shortcut.shortcut)
    },

    async remove_keyboard_shortcut(name) {
        chrome.commands.reset(name)
    }

};

