import type { DefaultDefinedCharacter } from './character';
import type { DefaultActionProxyProvider } from './action'
import { createElement, createImage, url, canvasDrawImages, typewriter } from './utils'
import { createChoice, createLayout } from './dom'

import './styles/dialog.css';
import './styles/characters.css';
import './styles/choices.css';
import './styles/input.css'

interface CharacterHandle {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  withEmotion: (emotion: string) => () => void;
  append: (className?: string, style?: string) => void;
  remove: (className?: string, style?: string, duration?: number) => (resolve: () => void) => void;

  emotions: Record<string, HTMLImageElement | Record<"head" | "left" | "right", HTMLImageElement>>
}

interface AudioHandle {
  element: HTMLAudioElement;

  stop: () => void;
  pause: () => void;
  play: () => void;
}

interface RendererStore {
  characters: Record<string, CharacterHandle>

  audio: Partial<Record<"music", AudioHandle>>
}

const createRenderer = (layout: ReturnType<typeof createLayout>, target: HTMLElement, characters: Record<string, DefaultDefinedCharacter>) => {
  const store: RendererStore = {
    characters: {},
    audio: {
      music: undefined
    }
  };

  const [charactersRoot, choicesRoot, dialogCollection, inputCollection] = layout;

  const renderCharacter = (character: string,) => {
    if (store.characters[character]) {
      return store.characters[character];
    }

    const canvas = createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const withEmotion = (emotion: string) => {
      const stored = store.characters[character].emotions[emotion];

      const render = (...images: HTMLImageElement[]) => {
        return () => {
          canvasDrawImages(canvas, ctx, images);
        }
      }

      if (stored) return render(...('head' in stored ? [stored.head, stored.left, stored.right] : [stored]));

      const emotionData = characters[character].emotion(emotion);

      if (typeof emotionData === 'string') {
        const img = createImage(emotionData);

        store.characters[character].emotions[emotion] = img;

        return render(img);
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
    }

    const append = (className?: string, style?: string) => {
      canvas.classList.value = '';

      if (className) {
        /**
         * A hack to restart CSS animations
         * @see https://css-tricks.com/restart-css-animation/#aa-update-another-javascript-method-to-restart-a-css-animation
         */
        void canvas.offsetWidth;
        canvas.classList.value = className || '';
      }

      canvas.style.cssText += style;

      if (!canvas.isConnected) {
        charactersRoot.appendChild(canvas)
      };
    }

    const remove = (className?: string, style?: string, duration?: number) => {
      if (className) canvas.classList.value = className;
      if (style) canvas.style.cssText += style;

      return (resolve: () => void) => {
        setTimeout(() => {
          canvas.remove();
          resolve();
        }, duration);
      }
    }

    return store.characters[character] = {
      canvas,
      ctx,
      emotions: {},
      withEmotion,
      append,
      remove
    }
  }

  const renderBackground = (background: string) => {
    target.style.backgroundRepeat = 'no-repeat';
    target.style.backgroundPosition = 'center';
    target.style.backgroundSize = 'cover';

    if (background.startsWith('http') || background.startsWith('data')) {
      target.style.backgroundImage = url(background);
    } else {
      target.style.backgroundImage = '';
      target.style.backgroundColor = background;
    }
  }

  const renderDialog = (content: string, character?: string, emotion?: string) => {
    const [dialog, text, name, person] = dialogCollection;

    return (resolve: () => void) => {
      /**
       * Сделать его видимым
       */
      dialog.style.display = 'grid';

      //* text start

      const end = typewriter(text, content);

      const onEvent = (event: MouseEvent | KeyboardEvent) => {
        const disconnect = () => {
          /**
           * Убрать слушатели событий
           */
          if (dialog.onclick === onEvent) dialog.onclick = null;

          /**
           * Скрыть диалог
           */
          dialog.style.display = 'none';

          /**
           * Очистить текст
           */
          text.textContent = '';
          name.textContent = '';
          name.style.color = '#fff';
        };

        if (!('key' in event) || event.key === ' ') {
          if (end()) disconnect(), resolve()
        }
      }

      /**
       * Здесь лучше использовать `onclick`, потому что 09.02.2023 около часа потратил на расследование почему происходил лишний переход при `restore`
       * Просто не удалялся старый слушатель события
       */
      dialog.onclick = onEvent;

      //* text end

      name.textContent = character ? characters[character].name : '';
      name.style.color = character ? characters[character].color : '#fff';

      //* image start

      if (character && emotion) {
        if (!store['characters'][character]) renderCharacter(character).withEmotion(emotion);

        const [canvas] = canvasDrawImages(undefined, undefined, Object.values(store['characters'][character]['emotions'][emotion]));

        delete dialog.dataset.personHidden;
        person.appendChild(canvas);
      } else {
        dialog.dataset.personHidden = 'true';
      }

      //* image end
    }
  }

  const renderChoices = (choices: Parameters<DefaultActionProxyProvider['choice']>) => {
    choicesRoot.style.display = 'flex';

    return (resolve: (selected: number) => void) => {
      const onClick = (event: MouseEvent) => {
        if (event.target && event.target instanceof HTMLButtonElement && event.target.getAttribute('aria-disabled') === 'false') {
          const value = Number(event.target.dataset.value);

          choicesRoot.innerHTML = '';
          choicesRoot.style.display = 'none';
          choicesRoot.removeEventListener('click', onClick)

          resolve(value);
        }
      }

      choicesRoot.addEventListener('click', onClick);

      for (let i = 0; i < choices.length; i++) {
        const [text, _, disabled] = choices[i];
        const selectable = disabled ? disabled() : true;

        choicesRoot.appendChild(createChoice(text, selectable, i));
      }
    }
  }

  const useMusic = (source: string, method: keyof RendererStore['audio']) => {
    const stored = store.audio?.[method];

    if (stored && stored.element.src.endsWith(source)) return stored.element.currentTime = 0, stored;

    const element = new Audio(source);

    const handle = {
      element,
      pause: element.pause,
      play: () => {
        /**
         * User should interact with the document first
         */
        const onClick = () => {
          element.play();
          removeEventListener('click', onClick);
        }

        addEventListener('click', onClick)
      },
      stop: () => {
        element.pause();
        element.currentTime = 0;
      }
    }

    return store.audio[method] = handle;
  }

  const renderInput = (question: string, onInput: (meta: { input: HTMLInputElement, error: HTMLSpanElement, event: InputEvent & { currentTarget: HTMLInputElement } }) => void, setup?: (input: HTMLInputElement) => void) => {
    const [container, input, text, error, button] = inputCollection;

    container.style.display = 'flex';
    text.textContent = question;

    return (resolve: () => void) => {
      setup?.(input);

      const onInputEvent = (event: InputEvent) => {
        onInput({ input, event, error } as any);
      }

      const onButtonClick = (_: MouseEvent) => {
        if (!error.textContent && input.validity.valid) {
          input.removeEventListener('input', onInputEvent as any);
          button.removeEventListener('click', onButtonClick);

          input.value = '';
          text.textContent = '';
          container.style.display = 'none';

          resolve();
        }
      }

      button.addEventListener('click', onButtonClick);
      input.addEventListener('input', onInputEvent as any);
    }
  }

  const useClear = () => {
    const [charactersRoot, choicesRoot, dialogCollection] = layout;

    /**
     * Очистить персонажей
     */
    charactersRoot.childNodes.forEach(node => node.remove());

    /**
     * Очистить выбор
     */
    choicesRoot.childNodes.forEach(node => node.remove());
    choicesRoot.style.display = 'none';

    /**
     * Скрыть диалог
     */
    const [dialog, text, name, person] = dialogCollection;

    dialog.style.display = 'none';
    text.textContent = '';
    name.textContent = '';
    person.childNodes.forEach(node => node.remove());

    /**
     * Отключить все звуки
     */
    for (const audio of Object.values(store.audio)) {
      if (!audio) continue;

      audio.stop();
    }

    return (resolve: () => void) => {
      resolve();
    }
  }

  return {
    character: renderCharacter,
    background: renderBackground,
    dialog: renderDialog,
    choices: renderChoices,
    input: renderInput,
    music: useMusic,
    clear: useClear,
    store
  }
}

export { createRenderer }