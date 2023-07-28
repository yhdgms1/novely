import type { FlowComponent, Accessor } from 'solid-js';
import { untrack, createEffect, on, onCleanup, Show } from 'solid-js';

const clickOutside = (node: HTMLElement, handler: () => void) => {
	const handleClick = (event: MouseEvent) =>
		node && !node.contains(event.target as HTMLElement) && !event.defaultPrevented && handler && handler();

	document.addEventListener('click', handleClick, true);
	onCleanup(() => document.removeEventListener('click', handleClick, true));
};

interface ModalProps {
	isOpen: Accessor<boolean>;
	setIsOpen?: (value: boolean) => void;

	onClose?: () => void;

	trapFocus: Accessor<boolean>;
}

const Modal: FlowComponent<ModalProps> = (props) => {
	let modalWindow: HTMLDivElement;

	const handleKeydown = (event: KeyboardEvent) => {
		if (untrack(props.isOpen) && event.key === 'Tab') {
			if (!untrack(props.trapFocus)) {
				/**
				 * When multiple Modals are opened we can prevent one from breaking another
				 */
				return;
			}

			if (!modalWindow) {
				/**
				 * In case modalWindow in undefined
				 */
				return;
			}

			const nodes = modalWindow.querySelectorAll('*');
			const tabbable = Array.from(nodes).filter((node) => (node as HTMLElement).tabIndex >= 0);

			let index = tabbable.indexOf(document.activeElement!);
			if (index === -1 && event.shiftKey) index = 0;

			index += tabbable.length + (event.shiftKey ? -1 : 1);
			index %= tabbable.length;

			(tabbable[index] as HTMLElement).focus();
			event.preventDefault();
		}
	};

	const close = () => {
		props.setIsOpen && props.setIsOpen(false);
		props.onClose && untrack(props.onClose);
	};

	createEffect(on(props.isOpen, (isOpen) => isOpen && props.onClose && untrack(props.onClose), { defer: true }));

	addEventListener('keydown', handleKeydown);
	onCleanup(() => removeEventListener('keydown', handleKeydown));

	return (
		<Show when={props.isOpen()}>
			<div
				role="dialog"
				class="dialog"
				aria-modal={true}
				ref={(element) => {
					modalWindow = element;
					clickOutside(element, close);
				}}
			>
				{props.children}
			</div>
		</Show>
	);
};

export { Modal };
