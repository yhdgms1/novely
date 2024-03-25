import type { VoidComponent } from 'solid-js';
import type { NovelyScreen } from '@novely/core';
import { For, Show, from } from 'solid-js';
import { useData } from '$context';
import { simple } from '$utils';
import { Icon } from '$components';

const MainMenu: VoidComponent = () => {
	const { t, storageData, coreData, options, $rendererState } = useData();
	const language = () => storageData().meta[0];

	const rendererStore = from($rendererState);

	const goto = simple((screen: NovelyScreen | (string & Record<never, never>)) => {
		if (!coreData().dataLoaded) return;

		$rendererState.setKey('screen', screen as NovelyScreen);
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
			<button type="button" class="button main-menu__button" onClick={() => goto('saves')}>
				<span class="main-menu__button__text">{t('Saves')}</span>
				<Icon children={/* @once */ Icon.Files()} />
			</button>
			<button type="button" class="button main-menu__button" onClick={() => goto('settings')}>
				<span class="main-menu__button__text">{t('Settings')}</span>
				<Icon children={/* @once */ Icon.Settings()} />
			</button>
			<Show when={language()} keyed>
				{/* In case developer needs an icon they could provide it in HTML as a `innerHTML` prop */}
				{(_) => <For each={rendererStore()!.mainmenu}>{(item) => <button {...item(goto)} />}</For>}
			</Show>
		</div>
	);
};

export { MainMenu };
