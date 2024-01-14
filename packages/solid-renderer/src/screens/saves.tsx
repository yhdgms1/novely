import type { VoidComponent } from 'solid-js';

import { Show, For } from 'solid-js';
import { capitalize, getDocumentStyles } from '$utils';
import { useData } from '$context';
import { useContextState } from '../store';
import { Game } from './game';

/**
 * When year changes page reload will be needed to render correctly but no one will notice
 */
const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();

const Saves: VoidComponent = () => {
	const { t, storeData, storeDataUpdate, options, setGlobalState, getContext } = useData();

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
					fallback={
						<div class="saves__list saves__list--empty">
							{t('NoSaves')}
						</div>
					}
				>
					<ol class="saves__list">
						<For each={saves()}>
							{(save) => {
								const iframe = document.createElement('iframe');

								iframe.src = 'about:blank';

								const [timestamp, type] = save[2];
								const date = new Date(timestamp);

								const year = date.getFullYear();

								const stringDate = capitalize(
									date.toLocaleDateString(language(), {
										year: year === CURRENT_YEAR ? undefined : 'numeric',
										weekday: 'long',
										month: 'long',
										day: 'numeric',
										dayPeriod: 'narrow',
										hour: 'numeric',
										minute: 'numeric',
										second: 'numeric',
									}),
								);

								const stringType = t(type === 'auto' ? 'Automatic' : 'Manual');

								// 😼
								const KEY = `save-${date}-${type}`;
								const ctx = useContextState(KEY);

								// todo: function to destroy context and do not forget about novely's stack context
								// todo: and also pass goingBack and preview to custom and function actions

								const game = <Game
									className='saves__list-item__preview'

									controls='inside'
									skipTypewriterWhenGoingBack={true}

									state={ctx.state}
									setState={ctx.setState}

									context={getContext(KEY)}
									store={getContext(KEY).store}

									isPreview={true}
								/>

								const i = iframe as unknown as HTMLIFrameElement;

								i.addEventListener('load', () => {
									const doc = i.contentDocument;

									if (!doc) return;

									const css = getDocumentStyles();

									getContext(KEY).root = doc.body;

									options.preview(save, KEY).then(() => {
										doc.head.innerHTML += `<style>${css}</style><style>:root { font-size: 25%; }</style>`
										doc.body.appendChild(game as unknown as HTMLElement)
									})
								})

								return (
									<li
										class="saves__list-item"
									>
										<div>
											{iframe}

										</div>
										<div>
											<span>{stringDate}</span>
										</div>
										{/* <button
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
										</button> */}
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
