import type { JSX, FlowComponent, Accessor } from 'solid-js';
import { untrack, splitProps, onCleanup, createEffect } from 'solid-js';
import { clsx } from 'clsx';

type NativeAttrs = JSX.DialogHtmlAttributes<HTMLDialogElement>;
type FinalNativeAttrs = Exclude<NativeAttrs, 'open' | 'ref' | 'classList'>;

type ModalProps = FinalNativeAttrs & {
	isOpen: Accessor<boolean>;
	setIsOpen?: (value: boolean) => void;

	trapFocus: Accessor<boolean>;
	isModal: boolean;
}

const Modal: FlowComponent<ModalProps> = (props) => {
	const [it, rest] = splitProps(props, ['isOpen', 'setIsOpen', 'trapFocus', 'isModal']);

	let dialog!: HTMLDialogElement;

	const handleKeydown = (event: KeyboardEvent) => {
		if (untrack(it.isOpen) && event.key === 'Tab') {
			if (!untrack(it.trapFocus)) {
				/**
				 * When multiple Modals are opened we can prevent one from breaking another
				 */
				return;
			}

			if (!dialog) {
				/**
				 * In case dialog in undefined
				 */
				return;
			}

			const nodes = dialog.querySelectorAll('*');
			const tabbable = Array.from(nodes).filter((node) => (node as HTMLElement).tabIndex >= 0);

			let index = tabbable.indexOf(document.activeElement!);
			if (index === -1 && event.shiftKey) index = 0;

			index += tabbable.length + (event.shiftKey ? -1 : 1);
			index %= tabbable.length;

			(tabbable[index] as HTMLElement).focus();
			event.preventDefault();
		}
	};

	addEventListener('keydown', handleKeydown);
	onCleanup(() => removeEventListener('keydown', handleKeydown));

	createEffect(() => {
		/**
		 * Modal requires to call `showModal`. When `showModal` is called ::backdrop is visible
		 */
		dialog[it.isOpen() ? it.isModal ? 'showModal' : 'show' : 'close']();
	});

	return (
		<dialog
			{...rest}

			class={clsx('dialog', rest.class)}

			ref={dialog}
		/>
	);
};

export { Modal };
