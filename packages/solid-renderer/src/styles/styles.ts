import style from './style.module.css';
import button from './button.module.css';
import characters from './characters.module.css';
import dialog from './dialog.module.css';

Object.assign(style, button, characters, dialog);

export { style }