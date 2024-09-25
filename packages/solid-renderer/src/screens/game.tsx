import type { Context } from '@novely/core';
import type { VoidComponent } from 'solid-js';
import type { SolidRendererStore } from '../renderer';
import type { IContextState } from '../context-state';
import { createSignal, untrack, For, Show, createUniqueId, createEffect, createMemo } from 'solid-js';
import { Character, DialogName, Modal, Icon, ControlPanelButtons, createTypewriter, Canvas } from '$components';
import { clickOutside } from '$actions';
import { useData } from '$context';
import { canvasDrawImages, imagePreloadWithCaching, isCSSImage, onKey } from '$utils';
import { destructure } from "@solid-primitives/destructure";
import { from } from '$utils';

interface GameProps {
	context: Context;

	$contextState: IContextState

	store: SolidRendererStore;

	controls: 'inside' | 'outside';
	skipTypewriterWhenGoingBack: boolean;

	isPreview?: boolean;
	className?: string;
}

const Game: VoidComponent<GameProps> = (props) => {
	const data = useData();

	const { text, dialog, characters, choice, input, background, custom, images } = destructure(from(props.$contextState));

	const rendererState = from(data.$rendererState);
	const exitPromptShown = () => rendererState().exitPromptShown;

	/**
	 * Can be destructured because these are passed without getters
	 */
	const { store, context, controls, skipTypewriterWhenGoingBack } = props;

	const [auto, setAuto] = createSignal(false);

	const onInputButtonClick = () => {
		if (input().error) return;

		const { resolve, cleanup } = input();

		cleanup?.();
		resolve?.();
	};

	const customs = () => {
		return Object.values(custom());
	}

	const speed = () => data.storageData().meta[1];

	const onWriterEnd = (cb: () => void) => {
		return (prm: boolean) => {
			const next = untrack(auto);

			/**
			 * When `auto` mode is disabled
			 */
			if (!next) return;

			if (prm) {
				setAuto(false);
			} else {
				untrack(cb);
			}
		};
	};

	const TextWriter = createTypewriter({
		resolve() {
			text().resolve?.();
		},
	});

	const DialogWriter = createTypewriter({
		resolve() {
			dialog().resolve?.();
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
		}, 0)
	})

	return (
		<div
			class={props.className}
			classList={{
				'game': true,
				'preview': props.isPreview
			}}
		>
			<Canvas
				class="background"
				resize={false}
				render={async (canvas, ctx) => {
					const bg = background().background;
					const isColor = !isCSSImage(bg);

					if (isColor) {
						ctx.fillStyle = bg;
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					} else {
						const img = await imagePreloadWithCaching(bg);

						/**
						 * Prevent race of promises
						 */
						if (bg !== background().background) {
							return;
						}

						const { clientWidth, clientHeight } = context.root;

						const maxFactor = 1 / Math.ceil(Math.max(img.width / clientWidth, img.height / clientHeight));

						canvas.width = Math.min(img.width * maxFactor, img.width) * devicePixelRatio;
						canvas.height = Math.min(img.height * maxFactor, img.height) * devicePixelRatio;

						ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					}
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
							<Character character={character} data={data!} characters={store.characters} />
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
				<DialogName
					character={dialog().miniature.character}
					name={dialog().name}
				/>
				<div
					class="action-dialog-container"
					data-no-person={!(dialog().miniature.character && dialog().miniature.emotion)}
					aria-disabled={!dialog().content}
					role="button"
					tabIndex={0}
					onClick={DialogWriter.clear}
					onKeyPress={onKey(DialogWriter.clear, 'Enter')}
					onKeyDown={onKey(DialogWriter.clear, ' ')}
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
							"action-dialog-content": true,
							"action-dialog-content--disable-shadow": props.isPreview
						}}
					>
						<DialogWriter.Typewriter
							attributes={{
								title:
									DialogWriter.state() === 'idle'
										? undefined
										: data.t(DialogWriter.state() === 'processing' ? 'CompleteText' : 'GoForward'),
							}}
							content={dialog().content}
							ignore={(skipTypewriterWhenGoingBack && context.meta.goingBack) || Boolean(props.isPreview)}
							speed={speed()}
							ended={onWriterEnd(DialogWriter.clear)}
						/>
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
				<span
					class="dialog-label"
					data-used={Boolean(choice().label)}
					aria-hidden={!choice().label}
				>
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
								<Show when={visible}>
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
													const img = await imagePreloadWithCaching(image);

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
				class='exit-dialog'
				isModal={true}
				isOpen={() => !props.isPreview && exitPromptShown()}
				trapFocus={() => !props.isPreview && exitPromptShown()}
			>
				<span class="dialog-label">
					{data.t('ExitDialogWarning')}
				</span>

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
					"action-text--shown": Boolean(text().content)
				}}
				aria-disabled={!text().content}
				role="button"
				tabIndex={0}
				onClick={TextWriter.clear}
				onKeyPress={onKey(TextWriter.clear, 'Enter')}
				onKeyDown={onKey(TextWriter.clear, ' ')}
			>
				<TextWriter.Typewriter
					attributes={{
						title:
							TextWriter.state() === 'idle'
								? undefined
								: data.t(TextWriter.state() === 'processing' ? 'CompleteText' : 'GoForward'),
					}}
					content={text().content}
					ignore={(skipTypewriterWhenGoingBack && context.meta.goingBack) || Boolean(props.isPreview)}
					speed={speed()}
					ended={onWriterEnd(TextWriter.clear)}
				/>
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
								<Icon children={Icon.Menu()} />
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
							auto={auto}
							setAuto={setAuto}
						/>
					</div>
				</div>
			</Show>

			<div class="action-image">
				<For each={Object.values(images())}>
					{image => image}
				</For>
			</div>
		</div>
	);
};

export { Game };
