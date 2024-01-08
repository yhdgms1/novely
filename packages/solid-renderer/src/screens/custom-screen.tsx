import type { VoidComponent, JSX } from 'solid-js';
import { createEffect, createSignal, Show } from 'solid-js';
import { useData } from '$context'

interface CustomScreenProps {
	/**
	 * Name of current custom screen
	 */
	name: string;
}

const CustomScreen: VoidComponent<CustomScreenProps> = (props) => {
	const { globalState, setGlobalState } = useData();
	const [dom, setDOM] = createSignal<Element | JSX.Element | null>(null);

	let unmount: undefined | (() => void);

	createEffect(() => {
		/**
		 * Clear previous screen effects
		 */
		if (unmount) unmount();

		/**
		 * CustomScreen is always rendered, so this check is required
		 */
		if (props.name in globalState.screens) {
			const current = globalState.screens[props.name]();

			setDOM(current.mount());
			unmount = current.unmount;

			return;
		}

		setDOM(null);
		unmount = undefined;
	});

	const onClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = ({ target }) => {
		if (target instanceof HTMLElement && target.dataset.novelyGoto) {
			setGlobalState('screen', target.dataset.novelyGoto);
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
