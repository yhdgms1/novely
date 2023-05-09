import type { VoidComponent, JSX } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { State } from '../renderer'

import { For, createUniqueId, createMemo } from 'solid-js'
import { capitalize, join } from '../utils'
import { useData } from '../context'

import { style } from '../styles/styles';

interface SettingsProps {
  setState: SetStoreFunction<State>;
}

const Settings: VoidComponent<SettingsProps> = (props) => {
  const data = useData();

  const language = () => data.storeData()!.meta[0];
  const textSpeed = () => data.storeData()!.meta[1];

  const languageNames = createMemo(() => new Intl.DisplayNames([language()], {
    type: 'language'
  }));

  const onLanguageSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = ({ currentTarget }) => {
    const selected = currentTarget.value;

    data.storeDataUpdate(prev => {
      return prev.meta[0] = selected, prev;
    });
  }

  const onSpeedSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = ({ currentTarget }) => {
    const selected = +currentTarget.value;

    data.storeDataUpdate(prev => {
      return prev.meta[1] = selected, prev;
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
      <div class={style.content}>
        <div class={style.select}>
          <label for={id}>{data.t('Language')}</label>
          <select id={id} onChange={onLanguageSelect}>
            <For each={data.options.languages}>
              {lang => <option value={lang} selected={lang === language()}>{capitalize(languageNames().of(lang) || lang)}</option>}
            </For>
          </select>
        </div>
        <div class={style.select}>
          <label for={id}>{data.t('TextSpeed')}</label>
          <select id={id} onChange={onSpeedSelect}>
            <For each={[90, 140, 190]}>
              {speed => <option value={speed} selected={speed === textSpeed()}>{speed}</option>}
            </For>
          </select>
        </div>
      </div>
    </div >
  )
}

export { Settings }