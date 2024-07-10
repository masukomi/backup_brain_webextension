# Backup Brain WebExtension

This is a Firefox & Chrome extension for easily adding links to [Backup Brain](https://backupbrain.app). 

## Installation 
[Install for Firefox](https://backupbrain.app/firefox_updates/backup_brain_firefox_v1.0.1.xpi)

or 

Install for Chrome ⬅ coming soon 

## Development

Firefox's Support of WebExtension v3 is pretty terrible, so we can't use the same plugin for Firefox & Chrome. 

As a result, the Firefox code can be found in the ~main~ branch and the Chrome code in the `manifest_v3` branch.

The Chrome code is a refinement of the Firefox code.

### Building
You can build an xpi file for Firefox by running `./tools/ff_release_maker`

Note that this will also update the version in the `manifest.json`

## License
This code is distributed under the MIT License. See the license file for details.
