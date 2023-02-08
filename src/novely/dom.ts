import { createElement } from './utils'

const createCharactersRoot = (parent: HTMLElement) => {
  const charactersRoot = createElement('div');
  charactersRoot.classList.add('novely-characters');

  parent.appendChild(charactersRoot);

  return charactersRoot;
}

export { createCharactersRoot }