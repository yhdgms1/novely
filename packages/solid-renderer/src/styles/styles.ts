import style from './root.module.css';
import button from './button.module.css';
import characters from './characters.module.css';
import dialog from './dialog.module.css';
import headlessDialog from './headlessDialog.module.css';
import mainMenu from './mainMenu.module.css';
import saves from './saves.module.css';
import controlPanel from './controlPanel.module.css';

Object.assign(style, button, characters, dialog, headlessDialog, mainMenu, saves, controlPanel);

export { style }