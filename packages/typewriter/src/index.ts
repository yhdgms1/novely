interface TypewriterOptions {
  /**
   * The node where the typewriter effect will be ran
   */
  node: HTMLElement,
  /**
   * Text to be written by typewriter effect
   */
  text: string,
  /**
   * Time for letter to be written
   */
  speed?: () => number;
  /**
   * Writed did it work itself
   */
  ended?: () => void;
}

const defaultSpeed = () => {
  return Math.min(90 * Math.random() + 100, 90);
}

/**
 * Typewriter
 */
const typewriter = ({ node, text, ended, speed = defaultSpeed, }: TypewriterOptions) => {
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

  let frame: number;

  const enqueue = () => {
    frame = requestAnimationFrame(queue)
  }

  const dequeue = () => {
    cancelAnimationFrame(frame);
  };

  let timeout = 0;
  let start = 0;

  const queue: FrameRequestCallback = (time) => {
    if (time >= start + timeout) {
      start = time;
      timeout = speed();
      
      process();
    } else if (!end) {
      enqueue();
    } else {
      dequeue();
    }
  }

  const process = () => {
    if (full[current]?.length > pos) {
      emptied[current].textContent += full[current][pos++];
      enqueue();
    } else if (current++ < full.length) {
      pos = 0;
      enqueue();
    } else {
      end = true;
      dequeue();
      ended && ended();
    }
  }

  process();

  return {
    /**
     * Did the typewriter ended it's task
     */
    end() {
      dequeue();

      if (end) return root.remove(), true;
      return root.innerHTML = text, end = true, false;
    },
    /**
     * Destroy
     */
    destroy() {
      dequeue(); root.remove();
    }
  }
}

export { typewriter }