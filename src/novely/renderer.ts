import type { DefaultDefinedCharacter } from './character';
import type { DefaultActionProxyProvider } from './action'
import { createElement, createImage, url, canvasDrawImages, typewriter } from './utils'
import { createChoice, createLayout } from './dom'

import './styles/dialog.css';
import './styles/characters.css';
import './styles/choices.css';

interface CharacterHandle {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  withEmotion: (emotion: string) => () => void;

  emotions: Record<string, HTMLImageElement | Record<"head" | "left" | "right", HTMLImageElement>>
}

interface RendererStore {
  characters: Record<string, CharacterHandle>

  audio: Partial<Record<"music", HTMLAudioElement>>
}

const createRenderer = (layout: ReturnType<typeof createLayout>, target: HTMLElement, characters: Record<string, DefaultDefinedCharacter>) => {
  const store: RendererStore = {
    characters: {},
    audio: {
      music: undefined
    }
  };

  const [charactersRoot, choicesRoot, dialogCollection] = layout;

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

    return store.characters[character] = {
      canvas,
      ctx,
      emotions: {},
      withEmotion,
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
          document.removeEventListener('keyup', onEvent);
          dialog.removeEventListener('click', onEvent);

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

      document.addEventListener('keyup', onEvent);
      dialog.addEventListener('click', onEvent);

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

    if (stored && stored.src.endsWith(source)) {
      return stored.currentTime = 0, stored;
    }

    return store.audio[method] = new Audio(source);
  }

  return {
    character: renderCharacter,
    background: renderBackground,
    dialog: renderDialog,
    choices: renderChoices,
    music: useMusic,
    store
  }
}

export { createRenderer }