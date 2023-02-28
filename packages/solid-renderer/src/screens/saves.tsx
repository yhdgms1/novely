import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { Storage, RendererInit } from '@novely/core'
import type { State } from '../renderer'

import { Show, For } from 'solid-js'
import { capitalize, join } from '../utils'
import { useData } from '../context'

import { style } from '../styles/styles';

interface SavesProps {
  setState: SetStoreFunction<State>;

  storage: Storage;
  set: RendererInit['set'];

  t: RendererInit['t'];
}

const Saves: VoidComponent<SavesProps> = (props) => {
  const data = useData()!;
  const saves = () => data.storeData()!.saves;
  const language = () => data.storeData()!.meta[0];

  const removeSave = (date: number) => {
    const _saves = saves();

    for (let i = 0; i < _saves.length; i++) {
      const current = _saves[i];

      if (current[2][0] === date) {
        _saves.splice(i, 1);
      }
    }

    data.storeDataUpdate(prev => {
      return (prev.saves = _saves), prev;
    });
  }

  return (
    <div
      classList={{
        [style.root]: true,
        [style.saves]: true
      }}
    >
      <div class={style.controls}>
        <button type="button" class={join(style.button, style.buttonSaves)} onClick={() => props.setState('screen', 'mainmenu')}>
          {data.t('GoBack')}
        </button>
      </div>
      <Show when={saves()} fallback={data.t('NoSaves')}>
        <ol class={style.list}>
          <For each={saves()}>
            {save => {
              const [date, type] = save[2];

              const stringDate = capitalize(new Date(date).toLocaleDateString(language(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }));
              const stringType = data.t(type === 'auto' ? 'Automatic' : 'Manual');

              return (
                <li>
                  <button type="button" class={join(style.button, style.buttonSaves)} onClick={props.set.bind(props.set, save)} aria-label={data.t('LoadASaveFrom') + ' ' + stringDate}>
                    {stringDate}
                    <span style={{ "margin-left": '1em' }}>{stringType}</span>
                  </button>
                  <button type="reset" class={join(style.button, style.buttonSavesDelete)} aria-label={data.t('DeleteASaveFrom') + ' ' + stringDate} onClick={[removeSave, date]}>
                    <span>{data.t('Remove')}</span>
                  </button>
                </li>
              )
            }}
          </For>
        </ol>
      </Show>
    </div >
  )
}

export { Saves }