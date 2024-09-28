import { Save } from '$components';
import { useData } from '$context';
import type { VoidComponent } from 'solid-js';
import { For, Show, createSignal, onCleanup, onMount } from 'solid-js';

const Saves: VoidComponent = () => {
	const { t, storageData, $rendererState } = useData();

	const [list, setList] = createSignal<HTMLOListElement>();

	/**
	 * Items that were observed so they now can call `.preview()`
	 * We do this to not load invisible saves
	 */
	const [loadingAllowed, setLoadingAllowed] = createSignal<number[]>([]);

	/**
	 * Every save (found by timestamp) that completed `.preview()`
	 */
	const [previewCompleted, setPreviewCompleted] = createSignal<number[]>([]);
	/**
	 * Groups of saves. We use this so saves that were shown at the same time will become visible together
	 */
	const [observedTargets, setObservedTargets] = createSignal<number[][]>([]);

	const saves = () => storageData().saves.slice().reverse();
	const language = () => storageData().meta[0];

	const processed = new Set<Element>();

	onMount(() => {
		const listElement = list();

		if (!listElement) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const currentEntryTimestamps: number[] = [];

				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					if (processed.has(entry.target)) return;
					if (!(entry.target instanceof HTMLElement)) return;

					processed.add(entry.target);

					setLoadingAllowed((prev) => {
						if (entry.target instanceof HTMLElement) {
							const timestamp = entry.target.dataset.timestamp;

							if (timestamp) {
								const parsed = Number(timestamp);

								if (Number.isFinite(parsed)) {
									currentEntryTimestamps.push(parsed);

									return [...prev, Number(timestamp)];
								}

								return prev;
							}
						}

						return prev;
					});
				});

				if (currentEntryTimestamps.length > 0) {
					setObservedTargets((targets) => [...targets, currentEntryTimestamps]);
				}
			},
			{
				root: listElement,
			},
		);

		listElement.childNodes.forEach((childNode) => {
			if (childNode instanceof HTMLElement) {
				observer.observe(childNode);

				onCleanup(() => {
					observer.unobserve(childNode);
				});
			}
		});

		onCleanup(() => {
			observer.disconnect();
		});
	});

	const isOverlayShown = (timestamp: number) => {
		const observed = observedTargets();
		const completed = previewCompleted();

		/**
		 * Find group that has that timestamp
		 */
		const targets = observed.find((array) => array.includes(timestamp));

		if (!targets) {
			return true;
		}

		/**
		 * Check if every item in that group is completed
		 */
		return !targets.every((item) => completed.includes(item));
	};

	return (
		<div class="saves">
			<div class="saves__controls">
				<button
					type="button"
					class="button saves__button"
					onClick={() => {
						$rendererState.setKey('screen', 'mainmenu');
					}}
				>
					{t('GoBack')}
				</button>
			</div>

			<div class="saves__list-container">
				<Show
					when={saves().length > 0}
					fallback={<div class="saves__list saves__list--empty">{t('NoSaves')}</div>}
				>
					<ol class="saves__list" ref={setList}>
						<For each={saves()}>
							{(save) => (
								<Save
									save={save}
									language={language()}
									observed={loadingAllowed().includes(save[2][0])}
									overlayShown={isOverlayShown(save[2][0])}
									onPreviewDone={() => {
										setPreviewCompleted((completed) => [...completed, save[2][0]]);
									}}
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
