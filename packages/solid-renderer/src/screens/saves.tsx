import type { VoidComponent } from 'solid-js';

import { Show, For } from 'solid-js';
import { capitalize } from '$utils';
import { useData } from '$context';
import { useContextState } from '../store';

const Saves: VoidComponent = () => {
	const { t, storeData, storeDataUpdate, options, setGlobalState } = useData();

	const saves = () => storeData().saves;
	const language = () => storeData().meta[0];

	const removeSave = (date: number) => {
		storeDataUpdate((prev) => {
			prev.saves = saves().filter((save) => save[2][0] !== date);

			return prev;
		});
	};

	return (
		<div class="root saves">
			<div class="saves__column">
				<button type="button" class="button saves__button" onClick={() => setGlobalState('screen', 'mainmenu')}>
					{t('GoBack')}
				</button>
			</div>
			<div class="saves__list-container">
				<Show
					when={saves().length > 0}
					fallback={<div class="saves__list saves__list--empty">{t('NoSaves')}</div>}
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

								const stringType = t(type === 'auto' ? 'Automatic' : 'Manual');

								// options.preview(save, `save-${date}-${type}`).then(() => {
								// 	console.log({...useContextState(`save-${date}-${type}`).state})
								// })

								return (
									<li class="saves__list-item">
										<button
											type="button"
											class="button saves__button-load"
											aria-label={t('LoadASaveFrom') + ' ' + stringDate}
											onClick={() => options.set(save)}
										>
											<span>{stringDate}</span>
											<span class="saves__button-load__type">{stringType}</span>
										</button>
										<button
											type="reset"
											class="button saves__button-reset"
											aria-label={t('DeleteASaveFrom') + ' ' + stringDate}
											onClick={[removeSave, date]}
										>
											<span>{t('Remove')}</span>
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
