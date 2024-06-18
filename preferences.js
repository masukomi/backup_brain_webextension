const Preferences = {


    defaults: {
        backup_brain_url: null,
        toolbar_button: 'show_menu',
        show_notifications: true,
        context_menu_items: true,
        show_tags: true,
        add_link_form_in_tab: false
    },

    async get(option) {
        // see the following for Storage Area APIs
        //  https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea
        let stored_value = await browser.storage.local.get(option)
        if (stored_value[option] === undefined || stored_value[option] == '' || stored_value[option] == null) {
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
        browser.storage.local.set(option_value)
    },

    async get_keyboard_shortcuts() {
        const shortcuts = await browser.commands.getAll()
        return shortcuts.filter(shortcut => shortcut.shortcut)
    },

    async remove_keyboard_shortcut(name) {
        browser.commands.reset(name)
    }

};
