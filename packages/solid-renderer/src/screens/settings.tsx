import type { VoidComponent, JSX } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { RendererInit } from '@novely/core'
import type { State } from '../renderer'

import { Show, For, createUniqueId } from 'solid-js'
import { capitalize, join } from '../utils'
import { useData } from '../context'

import { style } from '../styles/styles';

interface SettingsProps {
  setState: SetStoreFunction<State>;
  restore: RendererInit['restore'];

  stack: RendererInit['stack'];

  t: RendererInit['t'];
}

const Settings: VoidComponent<SettingsProps> = (props) => {
  const setScreen = (screen: "mainmenu" | "game" | "saves" | "settings" | 'loading') => props.setState('screen', screen)

  const data = useData()!;
  const saves = () => data.storeData()!.saves;
  const language = () => data.storeData()!.meta[0];

  const onSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = (e) => {
    const selected = e.currentTarget.value;

    data.storeDataUpdate(prev => {
      return prev.meta[0] = selected, prev;
    });

    // setScreen('loading');
    // data.options.storage.set(data.storeData()!).then(() => setScreen('settings'));
  }

  const id = createUniqueId();

  return (
    <div
      classList={{
        [style.root]: true,
        [style.settings]: true
      }}
    >
      <div class={style.controls}>
        <button type="button" class={join(style.button, style.buttonSettings)} onClick={() => setScreen('mainmenu')}>
          {data.t('HomeScreen')}
        </button>
        <button type="button" class={join(style.button, style.buttonSettings)} onClick={() => props.restore()}>
          {data.t('ToTheGame')}
        </button>
      </div>
      <Show when={saves()} fallback={data.t('NoSaves')}>
        {() => {
          const languageNames = new Intl.DisplayNames([language()], {
            type: 'language'
          });

          return (
            <div class={style.content}>
              <label for={id}>{data.t('Language')}</label>
              <select id={id} onChange={onSelect}>
                <For each={data.options.languages}>
                  {lang => <option value={lang} selected={lang === language()}>{capitalize(languageNames.of(lang) || lang)}</option>}
                </For>
              </select>
            </div>
          )
        }}
      </Show>
    </div>
  )
}

export { Settings }