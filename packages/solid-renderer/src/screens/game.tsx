import type { Context } from '@novely/core';
import type { VoidComponent } from 'solid-js';
import type { SolidRendererStore } from '../renderer';
import type { ContextStateStore, DeepAtom } from '@novely/renderer-toolkit'

import { memo } from '@novely/renderer-toolkit';
import { createSignal, untrack, For, Show, createUniqueId, createEffect, createMemo, from } from 'solid-js';
import { Character, DialogName, Modal, Icon, ControlPanelButtons, createTypewriter } from '$components';
import { clickOutside } from '$actions';
import { useData } from '$context';
import { canvasDrawImages, url, isCSSImage, onKey } from '$utils';

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

	const backgroundState = from(memo($contextState, (state) => state.background));
	const charactersState = from(memo($contextState, (state) => state.characters));
	const customsState = from(memo($contextState, (state) => state.custom));
	const dialogState = from(memo($contextState, (state) => state.dialog));
	const choiceState = from(memo($contextState, (state) => state.choice));
	const inputState = from(memo($contextState, (state) => state.input));
	const textState = from(memo($contextState, (state) => state.text));

	const rendererState = from(data.$rendererState);

	/**
	 * Can be destructured because these are passed without getters
	 */
	const { store, context, controls, skipTypewriterWhenGoingBack } = props;

	const [auto, setAuto] = createSignal(false);

	const onChoicesButtonClick = ([disabled, i]: [boolean, number]) => {
		if (disabled) return;

		const resolve = choiceState()!.resolve!;

		$contextState.setKey('choice', {
			choices: [],
			visible: false,
			resolve: undefined,
			label: '',
		});

		resolve(i);
	};

	const onInputButtonClick = () => {
		if (inputState()!.error) return;

		const { resolve, cleanup } = inputState()!;

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

	const layers = () => {
		return Object.values(customsState()!);
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
			const resolve = textState()!.resolve!;

			$contextState.setKey('text', { content: '' });
			resolve();
		},
	});

	const DialogWriter = createTypewriter({
		resolve() {
			const resolve = dialogState()!.resolve!;

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

	const background = createMemo(() => {
		const bg = backgroundState()!.background;
		const is = isCSSImage(bg);

		return {
			'background-image': is ? url(bg) : '',
			'background-color': is ? undefined : bg,
		}
	})

	const charactersCount = createMemo(() => {
		return Object.values(charactersState()!).reduce((acc, c) => {
			if (c && c.visible) {
				return acc + 1;
			}

			return acc;
		}, 0)
	})

	return (
		<div
			style={background()}
			class={props.className}
			classList={{
				'root': true,
				'game': true,
				'preview': props.isPreview
			}}
		>
			<div
				data-characters={true}
				class="characters"
				style={{
					'--shown-characters-count': charactersCount(),
				}}
			>
				<For each={Object.entries(charactersState()!)}>
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
					'action-dialog--visible': dialogState()!.visible,
					'action-dialog--hidden': !dialogState()!.visible,
				}}
			>
				<DialogName
					character={dialogState()!.miniature.character}
					name={dialogState()!.name}
					characters={data.characters}
				/>
				<div
					class="action-dialog-container"
					data-no-person={!(dialogState()!.miniature.character && dialogState()!.miniature.emotion)}
					aria-disabled={!dialogState()!.content}
					role="button"
					tabIndex={0}
					onClick={DialogWriter.clear}
					onKeyPress={onKey(DialogWriter.clear, 'Enter')}
					onKeyDown={onKey(DialogWriter.clear, ' ')}
				>
					<div class="action-dialog-person">
						<Show when={dialogState()!.miniature.emotion} keyed>
							{(emotion) => {
								const character = dialogState()!.miniature.character;

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
							content={dialogState()!.content}
							ignore={(skipTypewriterWhenGoingBack && context.meta.goingBack) || Boolean(props.isPreview)}
							speed={speed()}
							ended={onWriterEnd(DialogWriter.clear)}
						/>
					</div>
				</div>
			</div>

			<Modal
				isOpen={() => choiceState()!.visible}
				trapFocus={() => !props.isPreview && !rendererState()!.exitPromptShown}
			>
				<div class="dialog-container">
					<span class="dialog-fix" aria-hidden="true">
						&#8203;
					</span>
					<div class="dialog-panel">
						<span
							class="dialog-panel-label"
							data-used={Boolean(choiceState()!.label)}
							aria-hidden={!choiceState()!.label}
						>
							{choiceState()!.label || <>&#8197;</>}
						</span>
						<For each={choiceState()!.choices}>
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
				isOpen={() => inputState()!.visible}
				trapFocus={() => !props.isPreview && !rendererState()!.exitPromptShown}
			>
				<div class="dialog-container">
					<span class="dialog-fix" aria-hidden="true">
						&#8203;
					</span>
					<div class="dialog-panel input-dialog-panel">
						<label for="novely-input" class="input-dialog-label">
							<span>{inputState()!.label}</span>
							{inputState()!.element}
							<span aria-live="polite" aria-atomic="true">
								{inputState()!.error}
							</span>
						</label>
						<button
							type="submit"
							class="button dialog-input__button"
							onClick={onInputButtonClick}
							aria-disabled={Boolean(inputState()!.error)}
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

			<div data-custom={true}>
				<For each={layers()}>{(value) => value!.dom}</For>
			</div>

			<div
				class="action-text"
				data-shown={Boolean(textState()!.content)}
				aria-disabled={!textState()!.content}
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
					content={textState()!.content}
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
