import type { VoidComponent } from 'solid-js';

import { Show, For } from 'solid-js';
import { useData } from '$context';
import { Save } from '$components';


const Saves: VoidComponent = () => {
	const { t, storageData, $rendererState } = useData();

	const saves = () => storageData().saves;
	const language = () => storageData().meta[0];

	return (
		<div class="root saves">
			<div class="saves__column">
				<button type="button" class="button saves__button" onClick={() => $rendererState.setKey('screen', 'mainmenu')}>
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
					<ol
						class="saves__list"
						classList={{
							'saves__list-few': saves().length < 3
						}}
					>
						<For each={saves()}>
							{save => (
								<Save
									save={save}
									language={language()}
								/>
							)}
						</For>
					</ol>
				</Show>
			</div>
		</div>
	);
};

export { Saves };
