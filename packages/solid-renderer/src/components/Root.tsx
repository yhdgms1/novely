import { Provider } from '$context';
import { CustomScreen, Game, Loading, MainMenu, Saves, Settings } from '$screens';
import { from } from '$utils';
import type { Renderer, RendererInit } from '@novely/core';
import type { Context } from '@novely/core';
import type { DeepAtom, RendererStateStore } from '@novely/renderer-toolkit';
import type { Component } from 'solid-js';
import { Match, Show, Switch, createEffect } from 'solid-js';
import type { IContextState } from '../context-state';
import type { Emitter } from '../emitter';
import { useShared } from '../shared';
import type { EmitterEventsMap, RendererStoreExtension, SettingsIcons } from '../types';
import { destructure } from '@solid-primitives/destructure';
import type { createAudio } from '@novely/renderer-toolkit';

type CreateRootComponentOpts = {
	setRoot: (root: HTMLDivElement) => void;

	renderer: Renderer;

	fullscreen: boolean;
	emitter: Emitter<EmitterEventsMap>;

	skipTypewriterWhenGoingBack: boolean;
	controls: 'inside' | 'outside';
	settingsIcons: SettingsIcons;

	showAudioSettings: boolean;

	rendererContext: Context;

	coreOptions: RendererInit<any, any>;

	$contextState: IContextState;
	$rendererState: DeepAtom<RendererStateStore<RendererStoreExtension>>;

	audio: ReturnType<typeof createAudio>;
};

const createRootComponent = ({
	$rendererState,
	$contextState,
	coreOptions,
	setRoot,
	renderer,
	showAudioSettings,
	fullscreen,
	emitter,
	controls,
	skipTypewriterWhenGoingBack,
	settingsIcons,
	rendererContext,
	audio,
}: CreateRootComponentOpts) => {
	const Root: Component = () => {
		const { screen, loadingShown } = destructure(from($rendererState));

		createEffect(() => {
			const currentScreen = screen()!;

			if (fullscreen && document.fullscreenEnabled) {
				/**
				 * Will not work when initial screen is set to `game` because user interaction is required
				 */
				if (currentScreen === 'game' && !document.fullscreenElement) {
					document.documentElement.requestFullscreen().catch(() => {});

					/**
					 * When mainmenu is opened, then exit fullscreen
					 */
				} else if (currentScreen === 'mainmenu' && document.fullscreenElement && 'exitFullscreen' in document) {
					document.exitFullscreen().catch(() => {});
				}
			}

			if (currentScreen !== 'game' && currentScreen !== 'settings' && !loadingShown()) {
				rendererContext.audio.destroy();
			}

			emitter.emit('screen:change', currentScreen);
		});

		return (
			<div class="root" ref={setRoot}>
				<Provider
					$rendererState={$rendererState}
					storageData={coreOptions.storageData}
					coreData={coreOptions.coreData}
					options={coreOptions}
					renderer={renderer}
					emitter={emitter}
					getContext={renderer.getContext}
					removeContext={renderer.removeContext}
				>
					<Switch>
						<Match when={screen() === 'game'}>
							<Game
								$contextState={/* @once */ $contextState}
								context={/* @once */ rendererContext}
								controls={/* @once */ controls}
								skipTypewriterWhenGoingBack={/* @once */ skipTypewriterWhenGoingBack}
								store={useShared(coreOptions.mainContextKey)}
								audio={audio}
							/>
						</Match>
						<Match when={screen() === 'mainmenu'}>
							<MainMenu />
						</Match>
						<Match when={screen() === 'saves'}>
							<Saves />
						</Match>
						<Match when={screen() === 'settings'}>
							<Settings icons={settingsIcons} showAudioSettings={showAudioSettings} />
						</Match>
					</Switch>

					<Show when={loadingShown()}>
						<Loading overlay />
					</Show>

					<CustomScreen name={screen()!} />
				</Provider>
			</div>
		);
	};

	return Root;
};

export { createRootComponent };
