import type { Renderer, RendererStore } from '../dom-renderer/renderer'
import type { DefaultDefinedCharacter } from '../character';
import type { ValidAction } from '../action'
import type { JSX } from 'solid-js';

import { createEffect, createMemo, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

import { canvasDrawImages, createImage, typewriter, url } from '../utils'

import { Dialog, DialogPanel } from 'solid-headless';

import style from './style.module.css';

interface StateCharacter {
	/**
	 * `element.className`
	 */
	className: string;
	/**
	 * `element.style`
	 */
	style: string;
	/**
	 * Показывать ли элемент
	 */
	visible: boolean;
	/**
	 * `id` для `setTimeout`, который отвечает за `duration` в `hideCharacter`
	 */
	timeoutId: number;
}

interface StateDialog {
	/**
	 * Контент диалога
	 */
	content: string;
	/**
	 * Мини-персонаж
	 */
	character?: string;
	/**
	 * Эмоция мини-персонажа
	 */
	emotion?: string;
	/**
	 * Должен ли диалог быть показан
	 */
	visible: boolean;
	/**
	 * Функция `resolve`
	 */
	resolve?: () => void;
}

interface StateChoices {
	/**
	 * Функция `resolve`
	 * @param selected `index` выбранного
	 */
	resolve?: (selected: number) => void;
	/**
	 * Выборы
	 */
	choices: ([string, ValidAction[]] | [string, ValidAction[], () => boolean])[];
	/**
	 * Должен ли отображаться диалог
	 */
	visible: boolean
}

interface StateInput {
	/**
	 * Вопрос (что делает этот input)
	 */
	question: string;
	/**
	 * Элемент `input`
	 */
	element?: HTMLInputElement;
	/**
	 * Должен ли отображаться диалог с `input`
	 */
	visible: boolean;
	/**
	 * Функция `resolve`
	 */
	resolve?: () => void
	/**
	 * Ошибка
	 */
	error: string;
}

interface State {
	background: string;
	characters: Record<string, StateCharacter>
	dialog: StateDialog
	choices: StateChoices
	input: StateInput
}

interface SolidRendererStore extends RendererStore {
	dialogRef?: HTMLParagraphElement
}

const createSolidRenderer = () => {
	const [state, setState] = createStore<State>({
		background: '',
		characters: {},
		dialog: {
			content: '',
			visible: false
		},
		choices: {
			visible: false,
			choices: []
		},
		input: {
			question: '',
			error: '',
			visible: false
		}
	});

	const store: SolidRendererStore = {
		characters: {},
		audio: {
			music: undefined
		}
	};

	let characters!: Record<string, DefaultDefinedCharacter>;
	let renderer!: Renderer;

	let writer: ReturnType<typeof typewriter> | undefined;

	return {
		createLayout(_: HTMLElement) {
			return null;
		},
		createRenderer(c: Record<string, DefaultDefinedCharacter>): Renderer {
			characters = c;

			return renderer = {
				background(background) {
					setState('background', background);
				},
				character(character) {
					if (store.characters[character]) return store.characters[character];

					const canvas = <canvas /> as HTMLCanvasElement;
					const ctx = canvas.getContext('2d')!;

					return store.characters[character] = {
						canvas,
						ctx,
						emotions: {},
						withEmotion(emotion) {
							const stored = store.characters[character].emotions[emotion];

							const render = (...images: HTMLImageElement[]) => {
								return () => {
									canvasDrawImages(canvas, ctx, images);
								}
							}

							if (stored) return render(...('head' in stored ? [stored.head, stored.left, stored.right] : [stored]));

							const emotionData = characters[character].emotion(emotion);

							if (typeof emotionData === 'string') {
								return render(store.characters[character].emotions[emotion] = createImage(emotionData));
							}

							const head = createImage(emotionData.head);
							const left = createImage(emotionData.body.left);
							const right = createImage(emotionData.body.right);

							store.characters[character].emotions[emotion] = {
								head,
								left,
								right
							};

							return render(head, left, right);
						},
						append(className, style) {
							clearTimeout(state.characters[character]?.timeoutId);
							setState('characters', character, { className, style, visible: true })
						},
						remove(className, style, duration) {
							return (resolve) => {
								const timeoutId = setTimeout(() => {
									setState('characters', character, { visible: false });
									resolve();
								}, duration);

								setState('characters', character, { className, style, timeoutId })
							}
						}
					}
				},
				dialog(content, character, emotion) {
					return (resolve) => {
						setState('dialog', () => ({ content, character, emotion, visible: true, resolve }));
					}
				},
				choices(choices) {
					return (resolve) => {
						setState('choices', { choices, resolve, visible: true });
					}
				},
				clear() {
					return (resolve) => {
						setState('background', '#000');
						setState('choices', { visible: false });
						setState('dialog', { visible: false });

						for (const character of Object.keys(state.characters)) {
							setState('characters', character, { visible: false });
						}

						resolve();
					}
				},
				input(question, onInput, setup) {
					return (resolve) => {
						const errorHandler = (value: string) => {
							setState('input', { error: value });
						}

						const onInputHandler: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
							onInput({ input, event, error: errorHandler });
						};

						const input = <input type="text" name="novely-input" required autocomplete="off" onInput={onInputHandler} /> as HTMLInputElement;

						if (setup) setup(input);

						setState('input', { element: input, question, visible: true, resolve })
					}
				},
				music(source, method) {
					const stored = store.audio?.[method];

					if (stored && stored.element.src.endsWith(source)) return stored.element.currentTime = 0, stored;

					const element = new Audio(source);

					const handle = {
						element,
						pause: element.pause,
						play: () => {
							/**
							 * Пользователь должен сначала взаимодействовать с документом
							 */
							const onClick = () => {
								removeEventListener('click', onClick), element.play();
							}

							addEventListener('click', onClick)
						},
						stop: () => {
							element.pause();
							element.currentTime = 0;
						}
					}

					return store.audio[method] = handle;
				},
				store,
			}
		},
		Novely() {
			const background = createMemo(() => {
				const startsWith = String.prototype.startsWith.bind(state.background);
				const isImage = startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data');

				return { "background-image": isImage ? url(state.background) : '', "background-color": isImage ? undefined : state.background } as Partial<JSX.CSSProperties>
			});

			createEffect(() => {
				if (state && store.dialogRef) {
					writer?.destroy();
					writer = typewriter(store.dialogRef, state.dialog.content);
				}
			});

			const onChoicesButtonClick = ([disabled, i]: [boolean, number]) => {
				if (disabled) return;

				const resolve = state.choices.resolve;

				setState('choices', { choices: [], visible: false, resolve: undefined });
				resolve?.(i);
			}

			const onDialogClick = () => {
				if (writer && writer.end()) {
					/**
					 * Из-за рассинхронизации состояния `resolve` запускается после скрытия диалога
					 */
					const resolve = state.dialog.resolve;

					setState('dialog', { content: '', character: undefined, emotion: undefined, visible: false, resolve: undefined });
					resolve?.();
				}
			}

			const onInputButtonClick = () => {
				if (state.input.error || !state.input.element?.validity.valid) return;

				const resolve = state.input.resolve;

				setState('input', { element: undefined, question: '', visible: false });

				resolve?.();
			}

			return (
				<div class={style.root} style={background()}>
					<div class={style.characters}>
						<For each={Object.entries(state.characters)}>
							{([character, data]) => (
								<Show when={data.visible}>
									{() => {
										const canvas = store.characters[character].canvas;

										/**
										 * При одинаковых значениях `className` или `style` не будет вызван ещё раз и анимация не будет перезапущена
										 */
										createEffect(() => {
											void canvas.offsetWidth;

											if (data.className) canvas.classList.value = data.className;
											if (data.style) canvas.style.cssText = data.style;
										});

										return canvas
									}}
								</Show>
							)}
						</For>
					</div>
					<div
						class={style.dialog}
						style={{ display: state.dialog.visible ? 'flex' : 'none' }}
						onClick={onDialogClick}
					>
						<span
							class={style.dialog__name}
							style={{
								color: state.dialog.character ? state.dialog.character in characters ? characters[state.dialog.character].color : '#000' : '#000',
								display: state.dialog.character ? 'block' : 'none'
							}}
						>
							{state.dialog.character ? state.dialog.character in characters ? characters[state.dialog.character].name : state.dialog.character : ''}
						</span>
						<div class={style.dialog__container} data-no-person={!(state.dialog.character && state.dialog.emotion)}>
							<div class={style.dialog__person}>
								<Show when={state.dialog.character && state.dialog.emotion}>
									{() => {
										const character = state.dialog.character!;
										const emotion = state.dialog.emotion!;

										/**
										 * Если эмоция ещё не загружена - загрузим её
										 */
										if (!store['characters'][character]) {
											renderer.character(character).withEmotion(emotion)
										};

										const image = store['characters'][character]['emotions'][emotion];

										/**
										 * Если элемент - картинка, не будем выполнять лишнюю отрисовку на `canvas`
										 */
										if ('src' in image) return image.alt = '', image;

										const [canvas] = canvasDrawImages(undefined, undefined, Object.values(image));

										return canvas;
									}}
								</Show>
							</div>
							<p class={style.dialog__text} ref={store.dialogRef}>
								&nbsp;
							</p>
						</div>
					</div>

					<Dialog
						isOpen={state.choices.visible}
						class={style.choices}
					>
						<div class={style.choices__container}>
							<span
								class={style.choices__f}
								aria-hidden="true"
							>
								&#8203;
							</span>
							<DialogPanel class={style['choices__dialog-panel']}>
								<For each={state.choices.choices}>
									{([text, _, active], i) => {
										const disabled = active ? !active() : false;

										return (
											<button
												type="button"
												aria-disabled={disabled}
												onClick={[onChoicesButtonClick, [disabled, i()]]}
											>
												{text}
											</button>
										)
									}}
								</For>
							</DialogPanel>
						</div>
					</Dialog>

					<Dialog
						isOpen={state.input.visible}
						class={style.input}
					>
						<div class={style.input__container}>
							<span
								class={style.input__f}
								aria-hidden="true"
							>
								&#8203;
							</span>
							<DialogPanel class={style['input__dialog-panel']}>
								<label for="novely-input" class={style.input__label}>
									<span>
										{state.input.question}
									</span>
									{state.input.element}
									<span aria-live="polite">
										{state.input.error}
									</span>
								</label>
								<button
									onClick={onInputButtonClick}
									aria-disabled={(state.input.error || !state.input.element?.validity.valid) ? 'true' : 'false'}
								>
									Подтвердить
								</button>
							</DialogPanel>
						</div>
					</Dialog>
				</div>
			)
		}
	}
}

export { createSolidRenderer }
