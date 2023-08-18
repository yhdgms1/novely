import { onCleanup } from 'solid-js';

const clickOutside = (node: HTMLElement, handler: () => void) => {
	const handleClick = (event: MouseEvent) =>
		node && !node.contains(event.target as HTMLElement) && !event.defaultPrevented && handler && handler();

	document.addEventListener('click', handleClick, true);
	onCleanup(() => document.removeEventListener('click', handleClick, true));
};

export { clickOutside }
