const createElement = document.createElement.bind(document);

const appendChild = <T extends Node>(parent: Node, node: T) => {
  return parent.appendChild(node);
}

const createImage = (src: string) => {
  const img = createElement('img');

  return img.src = src, img;
}

const url = <T extends string>(str: T): `url(${T})` => {
  return `url(${str})`;
}

/**
 * Рисует `images` на `canvas`
 */
const canvasDrawImages = (canvas = createElement('canvas'), ctx = canvas.getContext('2d')!, images: HTMLImageElement[]) => {
  let set = false;

  for (const image of images) {
    const isLoaded = image.complete && image.naturalHeight !== 0;

    const draw = () => {
      if (!set) set = true, canvas.width = image.naturalWidth, canvas.height = image.naturalHeight;

      ctx.drawImage(image, 0, 0);
      image.removeEventListener('load', draw);
    }

    isLoaded ? draw() : image.addEventListener('load', draw);
  }

  return [canvas, ctx] as const;
}

const typewriter = (node: HTMLElement, text: string) => {
  let id!: number;

  const root = createElement('span');
  root.innerHTML = text;

  const traverse = (el: HTMLElement | ChildNode | Node, erase = false) => {
    const items = [] as ChildNode[];

    el.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        items.push(child);

        if (erase) child.textContent = '';
      }

      items.push(...traverse(child, erase));
    });

    return items;
  }

  const copy = root.cloneNode(true) as HTMLSpanElement;

  const emptied = traverse(root, true);
  const full = traverse(copy, false);

  node.appendChild(root);

  let current = 0;
  let pos = 0;

  let end = false;

  const process = () => {
    if (full[current]?.textContent!.length > pos) {
      emptied[current].textContent += full[current].textContent![pos++];

      id = setTimeout(process, typewriter.timeout())
    } else if (current++ < full.length) {
      pos = 0;
      process();
    } else {
      end = true;
    }
  }

  id = setTimeout(process, typewriter.timeout())

  /**
   * Did the typewriter ended it's task
   */
  return {
    end() {
      if (end) return clearTimeout(id), root.remove(), copy.remove(), true;
      return clearTimeout(id), root.replaceWith(copy), end = true, false;
    },
    destroy() {
      clearTimeout(id); root.remove(), copy.remove();
    }
  }
}

typewriter.timeout = () => Math.min(100 * Math.random() + 100, 140);

export { createElement, createImage, url, canvasDrawImages, typewriter, appendChild }