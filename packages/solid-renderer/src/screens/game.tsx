import type { Context } from '@novely/core';
import type { VoidComponent } from 'solid-js';
import type { SolidRendererStore } from '../renderer';
import type { ContextStateStore, DeepAtom } from '@novely/renderer-toolkit'

import { createSignal, untrack, For, Show, createUniqueId, createEffect, createMemo, from } from 'solid-js';
import { Character, DialogName, Modal, Icon, ControlPanelButtons, createTypewriter } from '$components';
import { clickOutside } from '$actions';
import { useData } from '$context';
import { canvasDrawImages, createImage, isCSSImage, onKey } from '$utils';
import { destructure } from "@solid-primitives/destructure";
import { PRELOADED_IMAGE_MAP } from '../shared'

interface GameProps {
	context: Context;

	$contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>

	store: SolidRendererStore;

	controls: 'inside' | 'outside';
	skipTypewriterWhenGoingBack: boolean;

	isPreview?: boolean;
	className?: string;
}

const Game: VoidComponent<GameProps> = (props) => {
	const data = useData();

	const { $contextState } = props;

	const contextState = () => {
		const accessor = from($contextState);

		return () => {
			return accessor()!;
		}
	}

	const { text, dialog, characters, choice, input, background, custom } = destructure(contextState());

	const rendererState = from(data.$rendererState);

	/**
	 * Can be destructured because these are passed without getters
	 */
	const { store, context, controls, skipTypewriterWhenGoingBack } = props;

	const [auto, setAuto] = createSignal(false);

	const onChoicesButtonClick = ([disabled, i]: [boolean, number]) => {
		if (disabled) return;

		const resolve = choice().resolve!;

		$contextState.setKey('choice', {
			choices: [],
			visible: false,
			resolve: undefined,
			label: '',
		});

		resolve(i);
	};

	const onInputButtonClick = () => {
		if (input().error) return;

		const { resolve, cleanup } = input();

		$contextState.setKey('input', {
			element: null,
			label: '',
			error: '',
			visible: false,
			cleanup: undefined,
			resolve: undefined,
		});

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
			const resolve = text().resolve!;

			$contextState.setKey('text', { content: '' });
			resolve();
		},
	});

	const DialogWriter = createTypewriter({
		resolve() {
			const resolve = dialog().resolve!;

			$contextState.setKey('dialog', {
				content: '',
				name: '',
				miniature: {},
				visible: false,
				resolve: undefined,
			});
			resolve();
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

	const bg = createMemo(() => {
		const bg = background().background;
		const isImage = isCSSImage(bg);

		return {
			'background-image': isImage ? bg : undefined,
			'background-color': isImage ? undefined : bg,
		}
	})

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
			<Show when={bg()['background-image']} fallback={<div class="background" style={bg()} />}>
				{src => {
					let img = PRELOADED_IMAGE_MAP.get(src());

					if (img) {
						const clone = img.cloneNode(true) as HTMLImageElement;

						return Object.assign(clone, {
							className: 'background'
						});
					}

					img = createImage(src());

					img.addEventListener('load', () => {
						PRELOADED_IMAGE_MAP.set(src(), img);
					});

					return Object.assign(img, {
						className: 'background'
					});
				}}
			</Show>

			<Show when={charactersCount() > 0}>
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
			</Show>

			<Show when={dialog().visible}>
				<div class="action-dialog">
					<DialogName
						character={dialog().miniature.character}
						name={dialog().name}
						characters={data.characters}
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

										const [canvas] = canvasDrawImages(undefined, undefined, Object.values(image));

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
			</Show>

			<Modal
				isOpen={() => choice().visible}
				trapFocus={() => !props.isPreview && !rendererState()!.exitPromptShown}
			>
				<div class="dialog-container">
					<span class="dialog-fix" aria-hidden="true">
						&#8203;
					</span>
					<div class="dialog-panel">
						<span
							class="dialog-panel-label"
							data-used={Boolean(choice().label)}
							aria-hidden={!choice().label}
						>
							{choice().label || <>&#8197;</>}
						</span>
						<For each={choice().choices}>
							{([text, active], i) => {
								const disabled = !active;
								const index = i();

								return (
									<button
										type="button"
										class="button"
										aria-disabled={disabled}
										onClick={[onChoicesButtonClick, [disabled, index]]}
									>
										{text}
									</button>
								);
							}}
						</For>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={() => input().visible}
				trapFocus={() => !props.isPreview && !rendererState()!.exitPromptShown}
			>
				<div class="dialog-container">
					<span class="dialog-fix" aria-hidden="true">
						&#8203;
					</span>
					<div class="dialog-panel input-dialog-panel">
						<label for="novely-input" class="input-dialog-label">
							<span>{input().label}</span>
							{input().element}
							<span aria-live="polite" aria-atomic="true">
								{input().error}
							</span>
						</label>
						<button
							type="submit"
							class="button dialog-input__button"
							onClick={onInputButtonClick}
							aria-disabled={Boolean(input().error)}
						>
							{data.t('Sumbit')}
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={() => rendererState()!.exitPromptShown && !props.isPreview}
				trapFocus={() => !props.isPreview && rendererState()!.exitPromptShown}
			>
				<div class="dialog-container">
					<span class="dialog-fix" aria-hidden="true">
						&#8203;
					</span>
					<div class="dialog-backdrop" />
					<div class="dialog-panel exit-dialog-panel">
						<span class="dialog-panel-label">
							{data.t('ExitDialogWarning')}
						</span>
						<div class="exit-dialog-panel-buttons">
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
					</div>
				</div>
			</Modal>

			<Show when={customs().length > 0}>
				<div data-custom={true}>
					<For each={customs()}>{(value) => value!.dom}</For>
				</div>
			</Show>

			<Show when={Boolean(text()!.content)}>
				<div
					class="action-text"
					aria-disabled={!text()!.content}
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
						content={text()!.content}
						ignore={(skipTypewriterWhenGoingBack && context.meta.goingBack) || Boolean(props.isPreview)}
						speed={speed()}
						ended={onWriterEnd(TextWriter.clear)}
					/>
				</div>
			</Show>

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

					<Show when={data.media.hyperWide() && controlPanelMenuExpanded() && !rendererState()!.exitPromptShown}>
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
		</div>
	);
};

export { Game };
