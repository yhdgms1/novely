import type { Renderer } from '@novely/core';
import type { VoidComponent } from 'solid-js';
import type { SetStoreFunction } from 'solid-js/store';
import type { SolidRendererStore } from '../renderer';
import type { AtContextState } from '../types'

import { createSignal, untrack, For, Show, createUniqueId, createEffect } from 'solid-js';
import { Character, DialogName, Modal, Icon, ControlPanelButtons, createTypewriter } from '$components';
import { clickOutside } from '$actions';
import { useData } from '$context';
import { canvasDrawImages, url, isCSSImage, onKey } from '$utils';

interface GameProps {
	state: AtContextState;
	setState: SetStoreFunction<AtContextState>;

	context: ReturnType<Renderer['getContext']>;

	store: SolidRendererStore;

	controls: 'inside' | 'outside';
	skipTypewriterWhenGoingBack: boolean;

	isPreview?: boolean;
	className?: string;
}

const Game: VoidComponent<GameProps> = (props) => {
	const data = useData();

	/**
	 * Can be destructured because these are passed without getters
	 */
	const { setState, store, context, controls, skipTypewriterWhenGoingBack } = props;

	const background = () => {
		const is = isCSSImage(props.state.background);

		return {
			'background-image': is ? url(props.state.background) : '',
			'background-color': is ? undefined : props.state.background,
		}
	};

	const [auto, setAuto] = createSignal(false);

	const onChoicesButtonClick = ([disabled, i]: [boolean, number]) => {
		if (disabled) return;

		const resolve = props.state.choices.resolve!;

		setState('choices', {
			choices: [],
			visible: false,
			resolve: undefined,
			question: '',
		});

		resolve(i);
	};

	const onInputButtonClick = () => {
		if (props.state.input.error) return;

		const resolve = props.state.input.resolve;
		const cleanup = props.state.input.cleanup;

		setState('input', {
			element: undefined,
			question: '',
			visible: false,
			cleanup: undefined,
			resolve: undefined,
		});

		cleanup?.();
		resolve?.();
	};

	const layers = () => Object.values(props.state.layers);

	const speed = () => data.storeData().meta[1];

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
			const resolve = props.state.text.resolve!;

			setState('text', { content: '', resolve: undefined });
			resolve();
		},
	});

	const DialogWriter = createTypewriter({
		resolve() {
			const resolve = props.state.dialog.resolve!;

			setState('dialog', {
				content: '',
				name: '',
				character: undefined,
				emotion: undefined,
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

	return (
		<div
			style={background()}
			class={props.className}
			classList={{
				'root': true,
				'game': true
			}}
		>
			<div
				data-characters={true}
				class="characters"
				style={{
					'--shown-characters-count': Object.values(props.state.characters).reduce((acc, char) => {
						if (char.visible) {
							return acc + 1;
						}

						return acc;
					}, 0),
				}}
			>
				<For each={Object.entries(props.state.characters)}>
					{([character, data]) => (
						<Show when={data.visible}>
							<Character character={character} data={data} characters={store.characters} />
						</Show>
					)}
				</For>
			</div>
			<div
				class="action-dialog"
				classList={{
					'action-dialog--visible': props.state.dialog.visible,
					'action-dialog--hidden': !props.state.dialog.visible,
				}}
			>
				<DialogName
					character={props.state.dialog.character}
					name={props.state.dialog.name}
					characters={data.characters}
				/>
				<div
					class="action-dialog-container"
					data-no-person={!(props.state.dialog.character && props.state.dialog.emotion)}
					aria-disabled={!props.state.dialog.content}
					role="button"
					tabIndex={0}
					onClick={DialogWriter.clear}
					onKeyPress={onKey(DialogWriter.clear, 'Enter')}
					onKeyDown={onKey(DialogWriter.clear, ' ')}
				>
					<div class="action-dialog-person">
						<Show when={props.state.dialog.emotion} keyed>
							{(emotion) => {
								const character = props.state.dialog.character;

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
							content={props.state.dialog.content}
							ignore={(skipTypewriterWhenGoingBack && context.meta.goingBack) || Boolean(props.isPreview)}
							speed={speed()}
							ended={onWriterEnd(DialogWriter.clear)}
						/>
					</div>
				</div>
			</div>

			<Modal
				isOpen={() => props.state.choices.visible}
				trapFocus={() => !props.isPreview && !data.globalState.exitPromptShown}
			>
				<div class="dialog-container">
					<span class="dialog-fix" aria-hidden="true">
						&#8203;
					</span>
					<div class="dialog-panel">
						<span
							class="dialog-panel-label"
							data-used={Boolean(props.state.choices.question)}
							aria-hidden={!props.state.choices.question}
						>
							{props.state.choices.question || <>&#8197;</>}
						</span>
						<For each={props.state.choices.choices}>
							{([text, _actions, active], i) => {
								const disabled = active ? !active() : false;
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
				isOpen={() => props.state.input.visible}
				trapFocus={() => !props.isPreview && !data.globalState.exitPromptShown}
			>
				<div class="dialog-container">
					<span class="dialog-fix" aria-hidden="true">
						&#8203;
					</span>
					<div class="dialog-panel input-dialog-panel">
						<label for="novely-input" class="input-dialog-label">
							<span>{props.state.input.question}</span>
							{props.state.input.element}
							<span aria-live="polite" aria-atomic="true">
								{props.state.input.error}
							</span>
						</label>
						<button
							type="submit"
							class="button dialog-input__button"
							onClick={onInputButtonClick}
							aria-disabled={Boolean(props.state.input.error)}
						>
							{data.t('Sumbit')}
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={() => data.globalState.exitPromptShown}
				trapFocus={() => !props.isPreview && data.globalState.exitPromptShown}
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
									data.setGlobalState('exitPromptShown', false);
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
				data-shown={Boolean(props.state.text.content)}
				aria-disabled={!props.state.text.content}
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
					content={props.state.text.content}
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

					<Show when={data.media.hyperWide() && controlPanelMenuExpanded() && !data.globalState.exitPromptShown}>
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
								data.setGlobalState('screen', 'settings');
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
