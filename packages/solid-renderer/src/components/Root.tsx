import type { Component } from 'solid-js';
import type { Emitter } from '../emitter';
import type { RendererStateStore, ContextStateStore, DeepMapStore } from '@novely/renderer-toolkit'
import type { EmitterEventsMap, RendererStoreExtension, SettingsIcons } from '../types';
import type { Context } from '@novely/core';
import { memo } from '@novely/renderer-toolkit';
import { Switch, Match, createEffect, from, Show } from 'solid-js';
import { Character, Renderer, RendererInit } from '@novely/core';
import { Provider } from '$context';
import { useShared } from '../shared';
import { Game, MainMenu, Saves, Settings, Loading, CustomScreen } from '$screens';

type CreateRootComponentOpts = {
  setRoot: (root: HTMLDivElement) => void

  renderer: Renderer

  characters: Record<string, Character>

  fullscreen: boolean
  emitter: Emitter<EmitterEventsMap>

  skipTypewriterWhenGoingBack: boolean
  controls: 'inside' | 'outside'
  settingsIcons: SettingsIcons

  rendererContext: Context

  coreOptions: RendererInit

  $contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>
  $rendererState: DeepMapStore<RendererStateStore<RendererStoreExtension>>
}

const createRootComponent = ({ $rendererState, $contextState, coreOptions, setRoot, characters, renderer, fullscreen, emitter, controls, skipTypewriterWhenGoingBack, settingsIcons, rendererContext }: CreateRootComponentOpts) => {
  const Root: Component = () => {
    const screen = from(memo($rendererState, (state) => state.screen));
    const loadingShown = from(memo($rendererState, (state) => state.loadingShown));

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

      emitter.emit('screen:change', currentScreen)
    });

    return (
      <div ref={setRoot}>
        <Provider
          $rendererState={$rendererState}

          storageData={coreOptions.storageData}
          coreData={coreOptions.coreData}
          options={coreOptions}
          renderer={renderer}
          emitter={emitter}

          characters={characters}

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
              />
            </Match>
            <Match when={screen() === 'mainmenu'}>
              <MainMenu />
            </Match>
            <Match when={screen() === 'saves'}>
              <Saves />
            </Match>
            <Match when={screen() === 'settings'}>
              <Settings icons={settingsIcons} />
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
}

export { createRootComponent }
