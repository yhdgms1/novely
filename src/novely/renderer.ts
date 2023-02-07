import type { DefaultDefinedCharacter } from './character';
import { createElement, createImage, url, canvasDrawImages } from './utils'
// @ts-expect-error package provides no types
import typer from 'typer-js'

import './styles/dialog.css';

interface CharacterHandle {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  withEmotion: (emotion: string) => () => Promise<void>;

  emotions: Record<string, Record<"head" | "left" | "right", HTMLImageElement>>
}

interface RendererStore {
  characters: Record<string, CharacterHandle>
  dialog?: readonly [HTMLDivElement, HTMLParagraphElement, HTMLSpanElement, HTMLDivElement]
}

const createDialog = () => {
  /**
   * Корневой элемент диалога
   */
  const dialog = createElement('div');
  dialog.classList.add('novely-dialog');

  /**
   * Блок с именем
   */
  const name = createElement('span');
  name.classList.add('novely-dialog__name');
  dialog.appendChild(name);

  /**
   * Блок с текстом
   */
  const text = createElement('p');
  text.classList.add('novely-dialog__text');
  dialog.appendChild(text);

  /**
   * Картинка персонажа
   */
  const person = createElement('div');
  person.classList.add('novely-dialog__person')
  dialog.appendChild(person);

  return [dialog, text, name, person] as const;
}

const createRenderer = (characters: Record<string, DefaultDefinedCharacter>) => {
  const store: RendererStore = {
    characters: {},
  };

  const renderCharacter = (character: string,) => {
    if (store.characters[character]) {
      return store.characters[character];
    }

    const canvas = createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const withEmotion = (emotion: string) => {
      const stored = store.characters[character].emotions[emotion];

      const render = (h: HTMLImageElement, l: HTMLImageElement, r: HTMLImageElement) => {
        return async () => {
          canvasDrawImages(canvas, ctx, [h, l, r]);
        }
      }

      if (stored) return render(stored.head, stored.left, stored.right);

      const emotionData = characters[character].emotion(emotion);

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

  const renderBackground = (target: HTMLElement, background: string) => {
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
    const [dialog, text, name, person] = store.dialog || (store.dialog = createDialog());

    return (container: HTMLElement, resolve: () => void) => {
      if (!dialog.isConnected) container.appendChild(dialog);

      /**
       * Сделать его видимым
       */
      dialog.style.display = 'grid';

      //* text start

      /**
       * Закончил ли typer написание
       */
      let ended = false;

      const t = typer(text, { min: 70, max: 140 }).line(content).end(() => {
        ended = true;
      });

      const onEvent = (event: MouseEvent | KeyboardEvent) => {
        const disconnect = () => {
          /**
           * Уничтожить инстанс typer
           */
          t.kill();

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

        if ((event instanceof MouseEvent) || (event instanceof KeyboardEvent && event.key === ' ')) {
          if (ended) {
            return disconnect(), resolve();
          }

          t.kill(), ended = true, text.innerHTML = content;
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

        person.appendChild(canvas);
      }

    }
  }

  return {
    character: renderCharacter,
    background: renderBackground,
    dialog: renderDialog
  }
}

export { createRenderer }