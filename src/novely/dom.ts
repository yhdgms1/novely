import { createElement } from './utils'

const createCharactersRoot = (parent: HTMLElement) => {
  const charactersRoot = createElement('div');
  charactersRoot.classList.add('novely-characters');

  parent.appendChild(charactersRoot);

  return charactersRoot;
}

const createChoices = () => {
  const choicesRoot = createElement('div');
  choicesRoot.classList.add('novely-choices');

  const createChoice = (text: string, selectable: boolean, onSelect: () => void) => {
    const button = createElement('button');

    button.textContent = text;
    button.ariaDisabled = String(!selectable);

    if (selectable) button.onclick = onSelect;

    choicesRoot.appendChild(button);

    return button;
  }

  return [choicesRoot, createChoice] as const;
}

const createDialog = () => {
  /**
   * Корневой элемент диалога
   */
  const dialog = createElement('div');
  dialog.classList.add('novely-dialog');

  /**
   * Блок с именем
   */
  const name = createElement('span');
  name.classList.add('novely-dialog__name');
  dialog.appendChild(name);

  /**
   * Блок с текстом
   */
  const text = createElement('p');
  text.classList.add('novely-dialog__text');
  dialog.appendChild(text);

  /**
   * Картинка персонажа
   */
  const person = createElement('div');
  person.classList.add('novely-dialog__person')
  dialog.appendChild(person);

  return [dialog, text, name, person] as const;
}

export { createCharactersRoot, createChoices, createDialog }