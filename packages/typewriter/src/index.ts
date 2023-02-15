const timeout = () => Math.min(100 * Math.random() + 100, 140);

/**
 * Typewriter
 * @param node The node where the typewriter effect will be
 * @param text Text to be written by typewriter effect
 */
const typewriter = (node: HTMLElement, text: string) => {
  let id!: number;

  const root = document.createElement('span');
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
      // todo: [...str]
      emptied[current].textContent += full[current].textContent![pos++];

      id = setTimeout(process, timeout())
    } else if (current++ < full.length) {
      pos = 0;
      process();
    } else {
      end = true;
    }
  }

  id = setTimeout(process, timeout())

  return {
    /**
     * Did the typewriter ended it's task
     */
    end() {
      if (end) return clearTimeout(id), root.remove(), copy.remove(), true;
      return clearTimeout(id), root.replaceWith(copy), end = true, false;
    },
    /**
     * Destroy
     */
    destroy() {
      clearTimeout(id); root.remove(), copy.remove();
    }
  }
}

export { typewriter }