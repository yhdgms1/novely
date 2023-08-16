import type { VoidComponent } from 'solid-js';
import type { SetStoreFunction } from 'solid-js/store';
import type { State } from '../renderer';

import { Show, For } from 'solid-js';
import { capitalize } from '../utils';
import { useData } from '../context';

interface SavesProps {
	setState: SetStoreFunction<State>;
}

const Saves: VoidComponent<SavesProps> = (props) => {
	const data = useData();

	const saves = () => data.storeData().saves;
	const language = () => data.storeData().meta[0];

	const removeSave = (date: number) => {
		data.storeDataUpdate((prev) => {
			prev.saves = saves().filter((save) => save[2][0] !== date);

			return prev;
		});
	};

	return (
		<div class="root saves">
			<div class="saves__column">
				<button type="button" class="button saves__button" onClick={() => props.setState('screen', 'mainmenu')}>
					{data.t('GoBack')}
				</button>
			</div>
			<div class="saves__list-container">
				<Show
					when={saves().length > 0}
					fallback={<div class="saves__list saves__list--empty">{data.t('NoSaves')}</div>}
				>
					<ol class="saves__list">
						<For each={saves()}>
							{(save) => {
								const [date, type] = save[2];

								const stringDate = capitalize(
									new Date(date).toLocaleDateString(language(), {
										weekday: 'long',
										year: 'numeric',
										month: 'long',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
										second: 'numeric',
									}),
								);

								const stringType = data.t(type === 'auto' ? 'Automatic' : 'Manual');

								return (
									<li class="saves__list-item">
										<button
											type="button"
											class="button saves__button-load"
											aria-label={data.t('LoadASaveFrom') + ' ' + stringDate}
											onClick={() => data.options.set(save)}
										>
											<span>{stringDate}</span>
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
								);
							}}
						</For>
					</ol>
				</Show>
			</div>
		</div>
	);
};

export { Saves };
