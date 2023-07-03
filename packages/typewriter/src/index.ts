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

const collectTextNodes = (el: HTMLElement | ChildNode | Node) => {
  const items: ChildNode[] = [];

  el.childNodes.forEach(child => {
    if (child.nodeName === '#text') items.push(child)
    else items.push(...collectTextNodes(child));
  });

  return items;
}

/**
 * Typewriter
 */
const typewriter = ({ node, text, ended, speed = defaultSpeed, }: TypewriterOptions) => {
  /**
   * Set content
   */
  node.innerHTML = text;

  const nodes = collectTextNodes(node).map((child) => {
    const letters = [...child.textContent!].map(char => {
      const text = document.createElement('span');

      /**
       * The content is the same, but letter is invisible
       */
      text.textContent = char;
      text.style.cssText = 'opacity: 0;';

      return text;
    });

    /**
     * Replace `Text` with `HTMLParagraphElement`s
     */
    child.replaceWith(...letters);

    return letters;
  });

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

  /**
   * Node that is used to
   */
  let container: Text;

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
    const block = nodes[current];

    if (block?.length > pos) {
      const span = block[pos];
      const text = span.textContent!;

      if (pos++ === 0) {
        span.replaceWith(container = document.createTextNode(text));
      } else {
        container.textContent += text;
        span.remove()
      }

      enqueue();
    } else if (current++ < nodes.length) {
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
     * End
     */
    end() {
      dequeue();

      /**
       * Should we really end
       */
      if (end) {
        node.innerHTML = '';
        return end;
      }

      /**
       * Or just complete text immediately
       */
      node.innerHTML = text;
      end = true;

      return false;
    },
    /**
     * Destroy
     */
    destroy() {
      dequeue();
      node.innerHTML = '';
    }
  }
}

export { typewriter }