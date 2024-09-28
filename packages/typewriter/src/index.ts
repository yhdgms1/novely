import type { TypewriterOptions } from './types';
import { collectTextNodes, defaultSpeed } from './utils';

const map = (
	it: string,
	cb: (value: string, prev: HTMLSpanElement | undefined) => HTMLSpanElement | void | undefined,
) => {
	const result: HTMLSpanElement[] = [];

	for (const value of it) {
		const val = cb(value, result.at(-1));

		if (val) {
			result.push(val);
		}
	}

	return result;
};

/**
 * Typewriter
 */
const typewriter = ({ node, text, ended, speed = defaultSpeed }: TypewriterOptions) => {
	/**
	 * Set content
	 */
	node.innerHTML = text;

	const nodes = collectTextNodes(node).map((child) => {
		const letters = map(child.textContent!, (char, prev) => {
			/**
			 * First space will also be included, but will not rendered, because browser cuts spaces at the start and end
			 */
			if (char === ' ' && prev) {
				prev.textContent += ' ';
				return void 0;
			} else {
				const text = document.createElement('span');

				text.textContent = char;

				/**
				 * The content is the same, but letter is invisible
				 */
				text.style.opacity = '0';

				return text;
			}
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
		frame = requestAnimationFrame(queue);
	};

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
		} else if (end) {
			dequeue();
		} else {
			enqueue();
		}
	};

	const process = () => {
		const block = nodes[current];

		if (block?.length > pos) {
			const span = block[pos];
			const text = span.textContent!;

			if (pos++ === 0) {
				span.replaceWith((container = document.createTextNode(text)));
			} else {
				container.textContent += text;
				span.remove();
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
	};

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
		},
	};
};

export { typewriter };
