import type { Renderer, RendererStore, CharacterHandle, AudioHandle } from '../dom-renderer/renderer'
import type { DefaultDefinedCharacter } from '../character';
import type { ValidAction } from '../action'

import { createEffect, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

import { canvasDrawImages, createImage, typewriter, url } from '../utils'

import { Dialog, DialogPanel } from 'solid-headless';

// todo: заменить на более красивые
import '../styles/dialog.css';
import '../styles/characters.css';
import '../styles/choices.css';
import '../styles/input.css'

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

interface State {
	background: string;
	characters: Record<string, StateCharacter>
	dialog: StateDialog
	choices: StateChoices
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
		}
	});

	const store: SolidRendererStore = {
		characters: {},
		audio: {
			music: undefined
		}
	};

	/**
	 * Элемент, в который маунтится `Novely`
	 */
	let target!: HTMLElement;
	let characters!: Record<string, DefaultDefinedCharacter>;
	let renderer!: Renderer;

	let writer: ReturnType<typeof typewriter> | undefined;

	return {
		createLayout(_: HTMLElement) {
			return null;
		},
		createRenderer(_: any, t: HTMLElement, c: Record<string, DefaultDefinedCharacter>): Renderer {
			target = t;
			characters = c;

			// @ts-ignore
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
					setState('dialog', { content, character, emotion });

					return (resolve) => {
						setState('dialog', { visible: true, resolve })
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
						setState('characters', {});
						setState('choices', { visible: false });
						setState('dialog', { visible: false });

						resolve();
					}
				}
			}
		},
		Novely() {
			createEffect(() => {
				if (state.background.startsWith('http') || state.background.startsWith('data')) {
					target.style.backgroundImage = url(state.background);
				} else {
					target.style.backgroundImage = '';
					target.style.backgroundColor = state.background;
				}
			});

			createEffect(() => {
				if (state.dialog.content && store.dialogRef) {
					writer = typewriter(store.dialogRef, state.dialog.content);
				}
			});

			return (
				<>
					<div class={style.characters}>
						<For each={Object.entries(state.characters)}>
							{([character, data]) => (
								<Show when={data.visible}>
									{() => {
										const canvas = store.characters[character].canvas;

										void canvas.offsetWidth;

										if (data.className) canvas.classList.value = data.className;
										if (data.style) canvas.style.cssText = data.style;

										return canvas
									}}
								</Show>
							)}
						</For>
					</div>
					<div
						class={style.dialog}
						style={{ display: state.dialog.visible ? 'flex' : 'none' }}
						onClick={() => {
							if (writer && writer.end()) {
								state.dialog.resolve?.();

								writer.destroy();
								setState('dialog', { content: '', character: undefined, emotion: undefined, visible: false, resolve: undefined });
							}
						}}
					>
						<span class={style.dialog__name} style={{ color: state.dialog.character ? characters[state.dialog.character].color : '#fff' }}>
							{state.dialog.character ? characters[state.dialog.character].name : '???'}
						</span>
						<div class={style.dialog__container}>
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
							<p class={style.dialog__text} ref={store.dialogRef} />
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
												onClick={() => {
													if (disabled) return;
													if (state.choices.resolve) state.choices.resolve(i());

													setState('choices', { choices: [], visible: false, resolve: undefined });
												}}
											>
												{text}
											</button>
										)
									}}
								</For>
							</DialogPanel>
						</div>
					</Dialog>
				</>
			)
		}
	}
}

export { createSolidRenderer }

