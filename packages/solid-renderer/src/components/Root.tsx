import type { Component } from 'solid-js';
import type { Emitter } from '../emitter';
import type { RendererStateStore, ContextStateStore, DeepMapStore } from '@novely/renderer-toolkit'
import type { EmitterEventsMap, RendererStoreExtension } from '../types';
import type { Context } from '@novely/core';
import { Switch, Match, createEffect, from } from 'solid-js';
import { Character, Renderer, RendererInit } from '@novely/core';
import { Provider } from '$context';
import { useShared } from '../shared';
import { Game, MainMenu, Saves, Settings, Loading, CustomScreen } from '$screens';

type CreateRootComponentOpts = {
  setRoot: (root: HTMLDivElement) => void;

  renderer: Renderer;

  characters: Record<string, Character>;

  fullscreen: boolean;
  emitter: Emitter<EmitterEventsMap>

  skipTypewriterWhenGoingBack: boolean;
  controls: 'inside' | 'outside'

  rendererContext: Context

  coreOptions: RendererInit;

  $contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>
  $rendererState: DeepMapStore<RendererStateStore<RendererStoreExtension>>
}

const createRootComponent = ({ $rendererState, $contextState, coreOptions, setRoot, characters, renderer, fullscreen, emitter, controls, skipTypewriterWhenGoingBack, rendererContext }: CreateRootComponentOpts) => {
  const Root: Component = () => {
    const rendererState = from($rendererState);

    const screen = () => {
      return rendererState()!.screen;
    }

    createEffect(() => {
      const screen = rendererState()!.screen;

      if (fullscreen && document.fullscreenEnabled) {
        /**
         * Will not work when initial screen is set to `game` because user interaction is required
         */
        if (screen === 'game' && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});

          /**
           * When mainmenu is opened, then exit fullscreen
           */
        } else if (screen === 'mainmenu' && document.fullscreenElement && 'exitFullscreen' in document) {
          document.exitFullscreen().catch(() => {});
        }
      }

      if (screen !== 'game' && screen !== 'settings' && screen !== 'loading') {
        rendererContext.audio.destroy();
      }

      emitter.emit('screen:change', screen)
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
              <Settings />
            </Match>
            <Match when={screen() === 'loading'}>
              <Loading />
            </Match>
          </Switch>

          <CustomScreen name={screen()} />
        </Provider>
      </div>
    );
  };

  return Root;
}

export { createRootComponent }
