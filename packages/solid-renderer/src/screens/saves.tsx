import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { State } from '../renderer'

import { Show, For } from 'solid-js'
import { capitalize } from '../utils'
import { useData } from '../context'

interface SavesProps {
  setState: SetStoreFunction<State>;
}

const Saves: VoidComponent<SavesProps> = (props) => {
  const data = useData();
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
    <div class="root saves">
      <div class="saves__column">
        <button type="button" class="button saves__button" onClick={() => props.setState('screen', 'mainmenu')}>
          {data.t('GoBack')}
        </button>
      </div>
      <div class="saves__list-container">
        <Show when={saves()} fallback={data.t('NoSaves')}>
          <ol class="saves__list">
            <For each={saves()}>
              {save => {
                const [date, type] = save[2];

                const stringDate = capitalize(new Date(date).toLocaleDateString(language(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }));
                const stringType = data.t(type === 'auto' ? 'Automatic' : 'Manual');

                return (
                  <li class="saves__list-item">
                    <button
                      type="button"
                      class="button saves__button-load"
                      aria-label={data.t('LoadASaveFrom') + ' ' + stringDate}
                      onClick={() => data.options.set(save)}
                    >
                      {stringDate}
                      <span class="saves__button-load__type">{stringType}</span>
                    </button>
                    <button
                      type="reset"
                      class="button saves__button-reset"
                      aria-label={data.t('DeleteASaveFrom') + ' ' + stringDate}
                      onClick={[removeSave, date]}
                    >
                      <span>{data.t('Remove')}</span>
                    </button>
                  </li>
                )
              }}
            </For>
          </ol>
        </Show>
      </div>
    </div >
  )
}

export { Saves }