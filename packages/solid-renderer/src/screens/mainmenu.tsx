import type { VoidComponent } from 'solid-js';
import type { NovelyScreen } from '@novely/core';
import { For, Show } from 'solid-js';
import { useData } from '$context';
import { simple } from '$utils';
import { Icon } from '$components';

const MainMenu: VoidComponent = () => {
	const { t, storeData, coreData, options, globalState, setGlobalState } = useData();
	const language = () => storeData().meta[0];

	const goto = simple((screen: NovelyScreen | (string & Record<never, never>)) => {
		if (!coreData().dataLoaded) return;

		setGlobalState('screen', screen);
	});

	return (
		<div class="root main-menu">
			<button type="button" class="button main-menu__button" onClick={options.newGame}>
				<span class="main-menu__button__text">{t('NewGame')}</span>
				<Icon children={/* @once */ Icon.FilePlus()} />
			</button>
			<button type="button" class="button main-menu__button" onClick={() => options.restore()}>
				<span class="main-menu__button__text">{t('LoadSave')}</span>
				<Icon children={/* @once */ Icon.Play()} />
			</button>
			<button type="button" class="button main-menu__button" onClick={() => setGlobalState('screen', 'saves')}>
				<span class="main-menu__button__text">{t('Saves')}</span>
				<Icon children={/* @once */ Icon.Files()} />
			</button>
			<button type="button" class="button main-menu__button" onClick={() => setGlobalState('screen', 'settings')}>
				<span class="main-menu__button__text">{t('Settings')}</span>
				<Icon children={/* @once */ Icon.Settings()} />
			</button>
			<Show when={language()} keyed>
				{/* @todo: button icon */}
				{(_) => <For each={globalState.mainmenu.items}>{(item) => <button {...item(goto)} />}</For>}
			</Show>
		</div>
	);
};

export { MainMenu };
