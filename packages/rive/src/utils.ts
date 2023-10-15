const hideNativeCharactersElement = (root: HTMLElement) => {
  const element = root.querySelector('.characters[data-characters="true"]');

  if (element) element.remove();
}

const insertCanvas = (parent: HTMLElement | null, canvas: HTMLCanvasElement) => {
  if (!parent) return;

  parent.classList.add('characters');

  const wrapper = document.createElement('div');

  wrapper.style.cssText += `overflow: clip; position: relative; width: 30vw; height: 80vh; opacity: 0;`
  canvas.style.cssText += `position: absolute; width: 100%; height: 100%;`

  wrapper.appendChild(canvas);
  parent.appendChild(wrapper);
}

export { hideNativeCharactersElement, insertCanvas }
