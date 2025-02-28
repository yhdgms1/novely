import type { VoidComponent } from 'solid-js';
import { createEffect, createMemo, createSignal, onCleanup, untrack } from 'solid-js';
import { TEXT_SPEED_MAP } from '../constants';
import { useData } from '$context';

const PRM = matchMedia('(prefers-reduced-motion: reduce)');

const Writer = class Writer {
	public completed: boolean;

	private input: string;
	private current: number;
	private endedCallback: () => void;
	private getDuration: () => number;
	private animation: Animation | null;

	private node: HTMLElement;
	private segments: ChildNode[];

	constructor(node: HTMLElement, input: string, getDuration: () => number, endedCallback: () => void) {
		this.completed = false;
		this.input = input;
		this.current = 0;
		this.animation = null;
		this.endedCallback = endedCallback;
		this.getDuration = getDuration;

		this.node = node;
		this.node.innerHTML = input;

		this.segments = [];

		if (input === '') {
			this.completed = true;
			this.endedCallback();

			return;
		}

		if (PRM.matches) {
			this.completed = true;
			this.endedCallback();

			return;
		}

		this.searchNodeForSegments(this.node);
		this.breakSegments();
	}

	private searchNodeForSegments(node: HTMLElement | ChildNode) {
		for (const child of Array.from(node.childNodes)) {
			if (child.nodeName === '#text') {
				this.segments.push(child);
			} else {
				this.searchNodeForSegments(child);
			}
		}
	}

	private makeSegmentNode(content: string) {
		const span = document.createElement('span');

		span.textContent = content;
		span.style.opacity = '0';

		return span;
	}

	private breakSegments() {
		const segments: ChildNode[] = [];

		for (const segment of this.segments) {
			if (!segment.textContent) {
				segments.push(segment);
				continue;
			}

			const parts = segment.textContent.split(' ').map((content, index, array) => {
				const end = index === array.length - 1;
				const string = end ? content : content + ' ';

				return this.makeSegmentNode(string);
			});

			segment.replaceWith(...parts);
			segments.push(...parts);
		}

		this.segments = segments;
	}

	private adjustDuration(content: string, duration: number) {
		if (content.length === 1) {
			return duration / 3;
		}

		if (content.length <= 3) {
			return duration / 2;
		}

		return duration;
	}

	public play() {
		if (this.completed) return;
		if (this.current >= this.segments.length) {
			this.endedCallback();
			this.completed = true;
		}

		const element = this.segments[this.current];

		if (element instanceof HTMLSpanElement) {
			const animation = element.animate(
				[
					{
						opacity: 0,
					},
					{
						opacity: 1,
					},
				],
				{
					duration: this.adjustDuration(element.textContent || '', this.getDuration()),
				},
			);

			animation.addEventListener('finish', () => {
				this.animation = null;

				element.replaceWith(document.createTextNode(element.textContent || ''));

				this.current++;
				this.play();
			});

			this.animation = animation;
		}
	}

	public pause() {
		if (this.animation) {
			this.animation.pause();
		}
	}

	public resume() {
		if (this.animation) {
			this.animation.play();
		}
	}

	public complete() {
		if (this.completed) return;

		if (this.animation) {
			this.animation.finish();
			this.animation = null;
		}

		this.node.innerHTML = this.input;
		this.completed = true;

		this.endedCallback();
	}

	public destroy() {
		if (this.animation) {
			this.animation.finish();
			this.animation = null;
		}

		this.node.innerHTML = '';
	}

	public setDurationFunction(fn: () => number) {
		this.getDuration = fn;
	}
};

type TypewriterState = 'processing' | 'done' | 'idle';

type TypewriterProps = {
	content: string | undefined;
};

type CreateTypewriterOptions = {
	resolve: () => void;
	ignore: () => boolean;

	onComplete: (prm: boolean, click: () => void) => void;
};

const createTypewriter = ({ ignore, onComplete, resolve }: CreateTypewriterOptions) => {
	let typewriter: InstanceType<typeof Writer> | undefined;

	const [state, setState] = createSignal<TypewriterState>('idle');

	const click = () => {
		if (!typewriter) return;

		if (typewriter.completed) {
			setState('idle');
			resolve();

			return;
		}

		typewriter.complete();
		setState('done');
	};

	const Typewriter: VoidComponent<TypewriterProps> = (props) => {
		const data = useData();
		const duration = createMemo(() => data.storageData().meta[1]);

		const getDurationFunction = () => {
			return TEXT_SPEED_MAP[untrack(duration)];
		};

		let node!: HTMLSpanElement;

		createEffect(() => {
			const text = props.content;

			typewriter?.destroy();

			setState('idle');

			if (!text) return;
			if (!node) return;

			if (untrack(ignore)) {
				node.innerHTML = text;

				setState('done');

				return;
			}

			setState('processing');

			typewriter = new Writer(node, text, getDurationFunction(), () => {
				setState('done');
				untrack(() => {
					onComplete(PRM.matches, click);
				});
			});

			typewriter.play();
		});

		createEffect(() => {
			duration();

			typewriter?.setDurationFunction(getDurationFunction());
		});

		onCleanup(() => {
			setState('idle');

			typewriter?.destroy();
		});

		return (
			<span
				ref={node}
				title={state() === 'idle' ? undefined : data.t(state() === 'processing' ? 'CompleteText' : 'GoForward')}
			/>
		);
	};

	return {
		Typewriter,
		click,
	};
};

export { createTypewriter };
