import { useData } from '$context';
import { simple } from '$utils';
import { from } from '$utils';
import type { NovelyScreen } from '@novely/core';
import type { VoidComponent } from 'solid-js';
import { For, Show } from 'solid-js';

const MainMenu: VoidComponent = () => {
	const { t, storageData, coreData, options, $rendererState } = useData();
	const language = () => storageData().meta[0];

	const rendererStore = from($rendererState);

	const goto = simple((screen: NovelyScreen | (string & Record<never, never>)) => {
		if (!coreData().dataLoaded) return;

		$rendererState.mutate((s) => s.screen, screen as NovelyScreen);
	});

	return (
		<div class="main-menu">
			<div class="main-menu__controls">
				<button
					type="button"
					class="button main-menu__button"
					onClick={() => {
						options.newGame();
					}}
				>
					<span class="main-menu__button__text">{t('NewGame')}</span>

					<svg width="24" height="24" viewBox="0 0 256 256">
						<use href="#novely-file-plus-icon" />
					</svg>
				</button>
				<button
					type="button"
					class="button main-menu__button"
					onClick={() => {
						options.restore();
					}}
				>
					<span class="main-menu__button__text">{t('LoadSave')}</span>

					<svg width="24" height="24" viewBox="0 0 256 256">
						<use href="#novely-play-game-icon" />
					</svg>
				</button>
				<button
					type="button"
					class="button main-menu__button"
					onClick={() => {
						goto('saves');
					}}
				>
					<span class="main-menu__button__text">{t('Saves')}</span>

					<svg width="24" height="24" viewBox="0 0 256 256">
						<use href="#novely-files-icon" />
					</svg>
				</button>
				<button
					type="button"
					class="button main-menu__button"
					onClick={() => {
						goto('settings');
					}}
				>
					<span class="main-menu__button__text">{t('Settings')}</span>

					<svg width="24" height="24" viewBox="0 0 256 256">
						<use href="#novely-settings-icon" />
					</svg>
				</button>

				<Show when={language()} keyed>
					{/* In case developer needs an icon they could provide it in HTML as a `innerHTML` prop */}
					{(_) => <For each={rendererStore()!.mainmenu}>{(item) => <button {...item(goto)} />}</For>}
				</Show>
			</div>
		</div>
	);
};

export { MainMenu };
