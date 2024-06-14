const Preferences = {

    storage_area: 'local',

    defaults: {
        backup_brain_url: '',
        toolbar_button: 'show_menu',
        show_notifications: true,
        context_menu_items: true,
        show_tags: true,
        add_link_form_in_tab: false
    },

    async get(option) {
        let option_value = {}
        option_value[option] = this.defaults[option]
        const value = await browser.storage[this.storage_area].get(option_value)
        return value[option]
    },

    async set(option, value) {
        let option_value = {}
        option_value[option] = value
        browser.storage[this.storage_area].set(option_value)
    },

    async get_keyboard_shortcuts() {
        const shortcuts = await browser.commands.getAll()
        return shortcuts.filter(shortcut => shortcut.shortcut)
    },

    async remove_keyboard_shortcut(name) {
        browser.commands.reset(name)
    }

};
