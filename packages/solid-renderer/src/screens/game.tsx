import { clickOutside } from '$actions';
import {
	Canvas,
	Character,
	ControlPanelButtons,
	DialogName,
	DialogOverview,
	Icon,
	Modal,
	createTypewriter,
} from '$components';
import { useData } from '$context';
import { canvasDrawImages, createImage, isCSSImage, onKey } from '$utils';
import { from } from '$utils';
import type { Context } from '@novely/core';
import { destructure } from '@solid-primitives/destructure';
import type { VoidComponent } from 'solid-js';
import { For, Index, Show, createEffect, createMemo, createSignal, createUniqueId, untrack } from 'solid-js';
import type { IContextState } from '../context-state';
import type { SolidRendererStore } from '../renderer';
import { Transition } from 'solid-transition-group';

type GameProps = {
	context: Context;

	$contextState: IContextState;

	store: SolidRendererStore;

	controls: 'inside' | 'outside';

	isPreview?: boolean;
	className?: string;
};

const Game: VoidComponent<GameProps> = (props) => {
	const data = useData();
	const { audio } = data;

	const {
		text,
		dialog,
		characters,
		choice,
		input,
		background,
		custom,
		images,
		dialogOverviewShown,
		mood,
		loading,
	} = destructure(from(props.$contextState));

	const rendererState = from(data.$rendererState);
	const exitPromptShown = () => rendererState().exitPromptShown;

	/**
	 * Can be destructured because these are passed without getters
	 */
	const { store, context, controls } = props;

	const [auto, setAuto] = createSignal(false);

	const onInputButtonClick = () => {
		if (input().error) return;

		const { resolve, cleanup } = input();

		cleanup?.();
		resolve?.();
	};

	const customs = () => {
		return Object.values(custom());
	};

	const TextWriter = createTypewriter({
		resolve() {
			text().resolve?.();
		},
		ignore: () => {
			return context.meta.goingBack || Boolean(props.isPreview);
		},
		onComplete: (prm, click) => {
			if (!auto()) return;

			if (prm) {
				// When (prefers-reduced-motion: reduce) content will be set immidiately
				// That's why we will just disable auto mode
				setAuto(false);
			} else {
				// Otherwise we will just simulate the click
				// todo: there should be a delay before going next
				click();
			}
		},
	});

	const DialogWriter = createTypewriter({
		resolve() {
			dialog().resolve?.();
		},
		ignore: () => {
			return context.meta.goingBack || Boolean(props.isPreview);
		},
		onComplete: (prm, click) => {
			if (!auto()) return;

			if (prm) {
				setAuto(false);
			} else {
				click();
			}
		},
	});

	const controlPanelMenuID = createUniqueId();
	const [controlPanelMenuExpanded, setControlPanelMenuExpanded] = createSignal(false);

	/**
	 * Close if open when switching
	 */
	createEffect(() => {
		if (!data.media.hyperWide()) {
			setControlPanelMenuExpanded(false);
		}
	});

	const charactersCount = createMemo(() => {
		return Object.values(characters()).reduce((acc, c) => {
			if (c && c.visible) {
				return acc + 1;
			}

			return acc;
		}, 0);
	});

	const [bg, setBg] = createSignal(background().background);

	createEffect(() => {
		const currentBackground = background().background;

		if (isCSSImage(currentBackground)) {
			createImage(currentBackground).then(() => {
				if (currentBackground === background().background) {
					setBg(`url(${JSON.stringify(currentBackground)})`);
				}
			});
		} else {
			setBg(background().background);
		}
	});

	return (
		<div
			class={props.className}
			classList={{
				game: true,
				preview: props.isPreview,
			}}
		>
			<div
				class="background"
				style={{
					'background-color': bg().startsWith('url') ? undefined : bg(),
					'background-image': bg().startsWith('url') ? bg() : undefined,
				}}
			/>

			<div
				data-characters={true}
				class="characters"
				style={{
					'--shown-characters-count': charactersCount(),
				}}
			>
				<For each={Object.entries(characters())}>
					{([character, data]) => (
						<Show when={data && data.visible}>
							<Character character={character} characters={store.characters} />
						</Show>
					)}
				</For>
			</div>

			<div
				class="action-dialog"
				classList={{
					'action-dialog--visible': dialog().visible,
					'action-dialog--hidden': !dialog().visible,
				}}
			>
				<DialogName character={dialog().miniature.character} name={dialog().name} mood={mood()} />
				<div
					class="action-dialog-container"
					data-no-person={!(dialog().miniature.character && dialog().miniature.emotion)}
					aria-disabled={!dialog().content}
					role="button"
					tabIndex={0}
					onClick={DialogWriter.click}
					onKeyPress={onKey(DialogWriter.click, 'Enter')}
					onKeyDown={onKey(DialogWriter.click, ' ')}
				>
					<Show when={dialog().miniature.emotion}>
						<div class="action-dialog-person">
							<Show when={dialog().miniature.emotion} keyed>
								{(emotion) => {
									const character = dialog().miniature.character;

									/**
									 * Если персонажа нет
									 */
									if (!character) return null;

									/**
									 * Если эмоция ещё не загружена - загрузим её
									 */
									if (!store.characters[character] || !store.characters[character].emotions[emotion]) {
										context.character(character).emotion(emotion, false);
									}

									const image = store.characters[character].emotions[emotion];

									/**
									 * Если элемент - картинка, не будем выполнять лишнюю отрисовку на `canvas`
									 */
									if ('src' in image) return image;

									const canvas = document.createElement('canvas');

									canvasDrawImages(canvas, undefined, Object.values(image));

									return canvas;
								}}
							</Show>
						</div>
					</Show>

					<div
						classList={{
							'action-dialog-content': true,
							'action-dialog-content--disable-shadow': props.isPreview,
						}}
					>
						<DialogWriter.Typewriter content={dialog().content} />
					</div>
				</div>
			</div>

			<Modal
				class="choice-dialog"
				isModal={false}
				// `inert` is used to make modal not get focus when opened in preview mode
				inert={props.isPreview}
				isOpen={() => choice().visible}
				trapFocus={() => !props.isPreview && !exitPromptShown()}
			>
				<span class="dialog-label" data-used={Boolean(choice().label)} aria-hidden={!choice().label}>
					{choice().label || <>&#8197;</>}
				</span>

				<div class="choice-dialog__choices">
					<For each={choice().choices}>
						{([text, active$, visible$, onSelect, image], i) => {
							const active = from(active$);
							const visible = from(visible$);

							const disabled = () => !active();
							const index = i();

							return (
								<Show when={visible()}>
									<button
										type="button"
										class="button choice-dialog__choice"
										aria-disabled={disabled()}
										onClick={() => {
											onSelect();

											if (disabled()) return;

											choice().resolve?.(index);
										}}
									>
										<span>{text}</span>

										<Show when={image !== ''}>
											<Canvas
												class="choice-dialog__choice-image"
												resize={false}
												render={async (canvas, ctx) => {
													const img = await createImage(image);

													if (!img) return;

													canvas.width = img.width;
													canvas.height = img.height;

													ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
												}}
											/>
										</Show>
									</button>
								</Show>
							);
						}}
					</For>
				</div>
			</Modal>

			<Modal
				class="input-dialog"
				isModal={false}
				// `inert` is used to make modal not get focus when opened in preview mode
				inert={props.isPreview}
				isOpen={() => input().visible}
				trapFocus={() => !props.isPreview && !exitPromptShown()}
			>
				<label for="novely-input" class="input-dialog__text input-dialog__label">
					{input().label}
				</label>

				{input().element}

				<span class="input-dialog__text input-dialog__error" aria-live="polite" aria-atomic="true">
					{input().error}
				</span>

				<button
					type="submit"
					class="button dialog-input__button"
					onClick={onInputButtonClick}
					aria-disabled={Boolean(input().error)}
				>
					{data.t('Sumbit')}
				</button>
			</Modal>

			<Modal
				class="exit-dialog"
				isModal={true}
				isOpen={() => !props.isPreview && exitPromptShown()}
				trapFocus={() => !props.isPreview && exitPromptShown()}
			>
				<span class="dialog-label">{data.t('ExitDialogWarning')}</span>

				<div class="exit-dialog-buttons">
					<button
						type="button"
						class="button"
						onClick={() => {
							data.$rendererState.setKey('exitPromptShown', false);
						}}
					>
						{data.t('ExitDialogBack')}
					</button>

					<button
						type="button"
						class="button"
						onClick={() => {
							data.options.exit(true);
						}}
					>
						{data.t('ExitDialogExit')}
					</button>
				</div>
			</Modal>

			<div data-custom={true}>
				<For each={customs()}>{(value) => value!.node}</For>
			</div>

			<div
				class="action-text"
				classList={{
					'action-text--shown': Boolean(text().content),
				}}
				aria-disabled={!text().content}
				role="button"
				tabIndex={0}
				onClick={TextWriter.click}
				onKeyPress={onKey(TextWriter.click, 'Enter')}
				onKeyDown={onKey(TextWriter.click, ' ')}
			>
				<TextWriter.Typewriter content={text().content} />
			</div>

			<Show when={!props.isPreview}>
				<div class="control-panel">
					<Show when={data.media.hyperWide()}>
						<Show when={!controlPanelMenuExpanded()}>
							<button
								type="button"
								class="button control-panel__button"
								title={data.t('OpenMenu')}
								aria-controls={controlPanelMenuID}
								aria-expanded={controlPanelMenuExpanded()}
								onClick={() => {
									setControlPanelMenuExpanded((prev) => !prev);
								}}
							>
								<Icon icon="#novely-list-icon" />
							</button>
						</Show>
					</Show>

					<Show when={data.media.hyperWide() && controlPanelMenuExpanded() && !exitPromptShown()}>
						<span class="control-panel-container-fix" aria-hidden="true">
							&#8203;
						</span>
						<div class="control-panel-container-backdrop" />
					</Show>

					<div
						role="menubar"
						id={controlPanelMenuID}
						class="control-panel-container"
						classList={{
							'control-panel-container--center': controls === 'inside',
							'control-panel-container--wide-closed': data.media.hyperWide() && !controlPanelMenuExpanded(),
							'control-panel-container--wide-open': data.media.hyperWide() && controlPanelMenuExpanded(),
						}}
						ref={(element) => {
							clickOutside(element, () => {
								if (untrack(data.media.hyperWide) && untrack(controlPanelMenuExpanded)) {
									setControlPanelMenuExpanded(false);
								}
							});
						}}
					>
						<ControlPanelButtons
							openSettings={() => {
								data.$rendererState.setKey('screen', 'settings');
							}}
							closeDropdown={() => {
								setControlPanelMenuExpanded(false);
							}}
							openDialogOverview={() => {
								props.$contextState.setKey('dialogOverviewShown', true);
							}}
							auto={auto}
							setAuto={setAuto}
						/>
					</div>
				</div>
			</Show>

			<div class="action-image">
				<Index each={images()}>
					{(image) => (
						<Transition
							onEnter={(el, done) => {
								const classesIn = image().classesIn;

								const onCompleted = () => {
									done();
									image().onIn();
								};

								if (!classesIn || classesIn.length === 0) {
									return onCompleted();
								}

								el.classList.add(...classesIn);
								el.addEventListener('animationend', onCompleted, { once: true });
							}}
							onExit={(el, done) => {
								const classesOut = image().classesOut;

								const onCompleted = () => {
									done();
									image().onOut();
								};

								if (!classesOut || classesOut.length === 0) {
									return onCompleted();
								}

								el.classList.add(...classesOut);
								el.addEventListener('animationend', onCompleted, { once: true });
							}}
						>
							<Show when={image().visible}>
								<div class="action-image__image-container">{image().image}</div>
							</Show>
						</Transition>
					)}
				</Index>
			</div>

			<DialogOverview
				context={context}
				audio={audio}
				shown={Boolean(!props.isPreview && dialogOverviewShown())}
				close={() => props.$contextState.setKey('dialogOverviewShown', false)}
			/>

			<Show when={loading()}>
				<div class="loading overlay game">
					<div class="loading__animation">
						<div />
						<div />
						<div />
						<div />
					</div>
				</div>
			</Show>
		</div>
	);
};

export { Game };
