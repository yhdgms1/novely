import type { VoidComponent } from 'solid-js';
import type { SetStoreFunction } from 'solid-js/store';
import type { State } from '../renderer';
import type { NovelyScreen } from '@novely/core';
import { For, Show } from 'solid-js';
import { useData } from '$context';
import { simple } from '$utils';

interface MainMenuProps {
	state: State;
	setState: SetStoreFunction<State>;
}

const MainMenu: VoidComponent<MainMenuProps> = (props) => {
	const data = useData();
	const language = () => data.storeData().meta[0];

	const goto = simple((screen: NovelyScreen | (string & Record<never, never>)) => {
		if (!data.coreData().dataLoaded) return;

		props.setState('screen', screen);
	})

	return (
		<div class="root main-menu">
			<button type="button" class="button main-menu__button" onClick={data.options.newGame}>
				{data.t('NewGame')}
			</button>
			<button type="button" class="button main-menu__button" onClick={() => data.options.restore()}>
				{data.t('LoadSave')}
			</button>
			<button type="button" class="button main-menu__button" onClick={() => props.setState('screen', 'saves')}>
				{data.t('Saves')}
			</button>
			<button type="button" class="button main-menu__button" onClick={() => props.setState('screen', 'settings')}>
				{data.t('Settings')}
			</button>
			<Show when={language()} keyed>
				{(_) => <For each={props.state.mainmenu.items}>{(item) => <button {...item(goto)} />}</For>}
			</Show>
		</div>
	);
};

export { MainMenu };
