import type { Component } from 'solid-js';
import type { Emitter } from '../emitter';
import type { RendererStateStore, DeepMapStore } from '@novely/renderer-toolkit'
import type { EmitterEventsMap, SolidContext, RendererStoreExtension } from '../types';
import { Switch, Match, createEffect } from 'solid-js';
import { useStore } from '@nanostores/solid'
import { Character, Renderer, RendererInit } from '@novely/core';
import { Provider } from '$context';
import { Game, MainMenu, Saves, Settings, Loading, CustomScreen } from '$screens';
import { useContextState } from '../store';

type CreateRootComponentOpts = {
  setRoot: (root:  HTMLDivElement) => void;

  renderer: Omit<Renderer, "getContext"> & {
    getContext(name: string): SolidContext;
  };

  characters: Record<string, Character>;

  fullscreen: boolean;
  emitter: Emitter<EmitterEventsMap>

  skipTypewriterWhenGoingBack: boolean;
  controls: 'inside' | 'outside'

  getVolume: (type: 'music' | 'sound' | 'voice') => number;

  rendererContext: SolidContext
  stateContext: ReturnType<typeof useContextState>

  coreOptions: RendererInit;

  $rendererState: DeepMapStore<RendererStateStore<RendererStoreExtension>>
}

const createRootComponent = ({ $rendererState, coreOptions, setRoot, characters, renderer, fullscreen, emitter, controls, skipTypewriterWhenGoingBack, getVolume, rendererContext, stateContext }: CreateRootComponentOpts) => {
  const Root: Component = () => {
    const rendererState = useStore($rendererState);

    const screen = () => {
      return rendererState().screen;
    }

    createEffect(() => {
      const screen = rendererState().screen;

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
                state={stateContext.state}
                setState={/* @once */ stateContext.setState}
                store={/* @once */ rendererContext.store}
                context={/* @once */ rendererContext}
                controls={/* @once */ controls}
                skipTypewriterWhenGoingBack={/* @once */ skipTypewriterWhenGoingBack}
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
