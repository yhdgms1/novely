import type { VoidComponent, JSX } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { State } from '../renderer'

import { Show, For, createUniqueId } from 'solid-js'
import { capitalize, join } from '../utils'
import { useData } from '../context'

import { style } from '../styles/styles';

interface SettingsProps {
  setState: SetStoreFunction<State>;
}

const Settings: VoidComponent<SettingsProps> = (props) => {
  const data = useData()!;
  const saves = () => data.storeData()!.saves;
  const language = () => data.storeData()!.meta[0];

  const onSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = (e) => {
    const selected = e.currentTarget.value;

    data.storeDataUpdate(prev => {
      return prev.meta[0] = selected, prev;
    });
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
        <button type="button" class={join(style.button, style.buttonSettings)} onClick={() => props.setState('screen', 'mainmenu')}>
          {data.t('HomeScreen')}
        </button>
        <button type="button" class={join(style.button, style.buttonSettings)} onClick={() => data.options.restore()}>
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
    </div >
  )
}

export { Settings }