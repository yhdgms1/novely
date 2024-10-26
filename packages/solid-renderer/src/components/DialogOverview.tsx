import { removeTagsFromHTML } from '$utils';
import type { Context } from '@novely/core';
import type { VoidComponent } from 'solid-js';
import { createSignal, createEffect, For, Show } from 'solid-js';
import { Icon, Modal } from '$components';
import { createAudio } from '@novely/renderer-toolkit';
import { useData } from '$context';

type DialogOverviewProps = {
	context: Context;

	shown: boolean;
	audio: ReturnType<typeof createAudio>;

	/**
	 * Close dialog overview
	 */
	close: () => void;
};

const DialogOverview: VoidComponent<DialogOverviewProps> = (props) => {
	const data = useData();

	const [scrollArea, setScrollArea] = createSignal<HTMLTableElement>();

	const [currentlyPlayingSource, setCurrentlyPlayingSource] = createSignal<null | string>(null);
	const [currentlyPlaying, setCurrentlyPlaying] = createSignal<null | ReturnType<typeof props.audio.getAudio>>(
		null,
	);

	let playingId = 0;

	createEffect(() => {
		const current = currentlyPlaying();
		const scrollAreaElement = scrollArea();

		if (props.shown) {
			/**
			 * When I open dialog overview — stop currently playing voice
			 */
			props.context.audio.voiceStop();

			if (scrollAreaElement) {
				Promise.resolve().then(() => {
					scrollAreaElement.scrollTop = scrollAreaElement.scrollHeight;
				});
			}
		} else {
			/**
			 * When I close it, stop currently playing voice from dialog overview
			 */
			current?.stop();
			setCurrentlyPlaying(null);
		}
	});

	return (
		<Modal class="dialog-overview" isModal={true} isOpen={() => props.shown} trapFocus={() => props.shown}>
			<div class="dialog-overview__head">
				<span>{data.t('DialogOverview')}</span>

				<button
					type="button"
					class="button"
					onClick={() => {
						props.close();
					}}
				>
					{data.t('Close')}
				</button>
			</div>

			<div class="dialog-overview__body">
				<table class="dialog-overview__list" ref={setScrollArea}>
					<Show when={props.shown} keyed>
						<For each={data.options.getDialogOverview()}>
							{(entry) => (
								<tr class="dialog-overview__list-item">
									<td class="dialog-overview__list-item__name">
										<span>{removeTagsFromHTML(entry.name)}</span>
									</td>

									<td>
										<Show when={entry.voice}>
											<button
												type="button"
												class="dialog-overview__button-audio-control"
												onClick={async () => {
													if (!entry.voice) return;

													const voice = props.audio.getAudio('voice', entry.voice);
													const source = currentlyPlayingSource();

													if (currentlyPlayingSource() === entry.voice) {
														await voice.stop();

														setCurrentlyPlaying(null);
														setCurrentlyPlayingSource('');
													} else {
														if (source) {
															const previous = props.audio.getAudio('voice', source);

															await previous.stop();
														}

														setCurrentlyPlaying(voice);
														setCurrentlyPlayingSource(entry.voice);

														await voice.reset();
														await voice.play();

														const currentPlayingId = ++playingId;

														voice.onEnded(() => {
															if (currentPlayingId === playingId) {
																setCurrentlyPlaying(null);
																setCurrentlyPlayingSource('');
															}
														});
													}
												}}
											>
												<Icon fill="currentColor" viewBox="0 0 256 256">
													<Show when={currentlyPlayingSource() === entry.voice} fallback={<Icon.PlayMedia />}>
														<Icon.StopMedia />
													</Show>
												</Icon>
											</button>
										</Show>
									</td>

									<td class="dialog-overview__list-item__text">
										<span>{removeTagsFromHTML(entry.text)}</span>
									</td>
								</tr>
							)}
						</For>
					</Show>
				</table>
			</div>
		</Modal>
	);
};

export { DialogOverview };
