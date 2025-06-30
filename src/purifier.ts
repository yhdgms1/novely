/**
 * Games does not need a browsing behaviour where user can select any text, open context menu and also see
 * the "title" attribute showing up.
 *
 * A common thing for web is to set pointer cursor to interactive elements, but outside of the web cursor mostly is default arrow
 *
 * Drag is a good thing, and I think there might be interesting mini-games that would require dragging something but
 * in this case it's not used and will be disabled
 */

import './css/purifier.css';

if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();

    return false;
  });
}

document.addEventListener('selectstart', () => {
  const selection = window.getSelection();

  if (selection) {
    selection.removeAllRanges();
  }
});

document.addEventListener('dragstart', (event) => {
  event.preventDefault();

  return false;
});

const MO = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
      if (mutation.target instanceof HTMLElement && mutation.target.hasAttribute('title')) {
        mutation.target.removeAttribute('title');
      }
    }
  }
});

MO.observe(document.body, { childList: true, subtree: true, attributes: true });
