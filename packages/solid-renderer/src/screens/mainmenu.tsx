import type { VoidComponent } from 'solid-js';
import type { SetStoreFunction } from 'solid-js/store';
import type { State } from '../renderer';
import type { NovelyScreen } from '@novely/core';
import { For, Show } from 'solid-js';
import { useData } from '$context';
import { simple } from '$utils';
import { Icon } from '$components';

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
	});

	return (
		<div class="root main-menu">
			<button type="button" class="button main-menu__button" onClick={data.options.newGame}>
				<span class="main-menu__button__text">{data.t('NewGame')}</span>
				<Icon children={/* @once */ Icon.FilePlus()} />
			</button>
			<button type="button" class="button main-menu__button" onClick={() => data.options.restore()}>
				<span class="main-menu__button__text">{data.t('LoadSave')}</span>
				<Icon children={/* @once */ Icon.Play()} />
			</button>
			<button type="button" class="button main-menu__button" onClick={() => props.setState('screen', 'saves')}>
				<span class="main-menu__button__text">{data.t('Saves')}</span>
				<Icon children={/* @once */ Icon.Files()} />
			</button>
			<button type="button" class="button main-menu__button" onClick={() => props.setState('screen', 'settings')}>
				<span class="main-menu__button__text">{data.t('Settings')}</span>
				<Icon children={/* @once */ Icon.Settings()} />
			</button>
			<Show when={language()} keyed>
				{/* @todo: button icon */}
				{(_) => <For each={props.state.mainmenu.items}>{(item) => <button {...item(goto)} />}</For>}
			</Show>
		</div>
	);
};

export { MainMenu };
