import type { VoidComponent, JSX } from 'solid-js';
import type { NovelyScreen } from '@novely/core';
import { noop } from '@novely/renderer-toolkit'
import { createEffect, createSignal, Show } from 'solid-js';
import { useData } from '$context'
import { useStore } from '@nanostores/solid';

interface CustomScreenProps {
	/**
	 * Name of current custom screen
	 */
	name: string;
}

const CustomScreen: VoidComponent<CustomScreenProps> = (props) => {
	const { $rendererState } = useData();
	const [dom, setDOM] = createSignal<Element | JSX.Element | null>(null);

	const rendererState = useStore($rendererState);

	let unmount = noop;

	createEffect(() => {
		/**
		 * Clear previous screen effects
		 */
		unmount();

		const screens = rendererState().screens;

		/**
		 * CustomScreen is always rendered, so this check is required
		 */
		if (props.name in screens) {
			const current = screens[props.name]();

			setDOM(current.mount());
			unmount = current.unmount || noop;

			return;
		}

		setDOM(null);
		unmount = noop;
	});

	const onClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = ({ target }) => {
		if (target instanceof HTMLElement && target.dataset.novelyGoto) {
			$rendererState.setKey('screen', target.dataset.novelyGoto as NovelyScreen)
		}
	};

	return (
		<Show when={dom()}>
			<div class="root custom" onClick={onClick}>
				{dom()}
			</div>
		</Show>
	);
};

export { CustomScreen };
