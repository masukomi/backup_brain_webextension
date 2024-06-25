//import {Preferences} from './preferences.js'

async function restorePrefs(){
    // const bb_url = await Preferences.get('backup_brain_url')
    let storage = await chrome.storage.sync.get('backup_brain_url')
    let bb_url = storage.backup_brain_url
    if (bb_url) {
        document.getElementById('backup_brain_url').value = bb_url;
    }
}
async function savePrefs(){
    let new_bb_url=document.getElementById('backup_brain_url').value;
    let new_values = {}
    if (new_bb_url) {
        new_values['backu_brain_url'] = new_bb_url
    } else {
        document.getElementById('feedback').innerHTML="<span style='color: red'>Please enter the url of your Backup Brain</span>"

    }

    let show_notifications=document.getElementById('show_notifications').checked;
    new_values['show_notifications'] = show_notifications;

    await chrome.storage.sync.set(new_values);

    if (new_bb_url){
        document.getElementById('feedback').innerHTML="<span style='color: green'>Updated</span>"
    }

}


document.addEventListener('DOMContentLoaded', restorePrefs);
document.getElementById('save')?.addEventListener('click',
  savePrefs);
