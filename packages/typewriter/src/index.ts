const timeout = () => Math.min(100 * Math.random() + 100, 140);

/**
 * Typewriter
 * @param node The node where the typewriter effect will be
 * @param text Text to be written by typewriter effect
 */
const typewriter = (node: HTMLElement, text: string, cb?: () => void) => {
  let id!: number;

  const root = document.createElement('span');
  root.innerHTML = text;

  const traverse = (el: HTMLElement | ChildNode | Node, erase: boolean) => {
    const items = [] as ChildNode[];

    el.childNodes.forEach(child => {
      if (child.nodeName === '#text') {
        items.push(child);

        if (erase) child.textContent = '';
      }

      items.push(...traverse(child, erase));
    });

    return items;
  }

  /**
   * The simplest division into graphemes. Does not work with more complex symbols
   */
  const full = traverse(root.cloneNode(true), false).map((child) => [...child.textContent!]);
  const emptied = traverse(root, true);

  node.appendChild(root);

  let current = 0;
  let pos = 0;

  let end = false;

  /**
   * Clear's the timeout
   */
  const clear = () => {
    clearTimeout(id)
  };

  const process = () => {
    if (full[current]?.length > pos) {
      emptied[current].textContent += full[current][pos++];
      setTimeout(process, timeout());
    } else if (current++ < full.length) {
      pos = 0;
      process();
    } else {
      end = true;
      cb && (id = setTimeout(cb, 790));
    }
  }

  process();

  return {
    /**
     * Did the typewriter ended it's task
     */
    end() {
      if (end) return clear(), root.remove(), true;
      return clear(), root.innerHTML = text, end = true, false;
    },
    /**
     * Destroy
     */
    destroy() {
      clear(); root.remove();
    }
  }
}

export { typewriter }