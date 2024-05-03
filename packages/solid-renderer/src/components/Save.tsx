import type { VoidComponent } from 'solid-js';
import type { Save as NovelySave } from '@novely/core';
import { Show, createSignal, createEffect, onCleanup, untrack } from 'solid-js';
import { Transition } from 'solid-transition-group';
import { useData } from '$context';
import { capitalize, getDocumentStyles } from '$utils';
import { createRetrieved } from "retrieved";
import { removeContextState, useContextState } from '../context-state'
import { useShared, removeShared } from '../shared';
import { Game } from '$screens';

/**
 * When year changes page reload will be needed to render correctly but no one will notice
 */
const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();

const stylesheet = createRetrieved(getDocumentStyles);

interface SaveProps {
  save: NovelySave;
  language: string;
}

const Save: VoidComponent<SaveProps> = (props) => {
  const { t, options, getContext, storageData, storageDataUpdate, removeContext } = useData();
  const [iframe, setIframe] = createSignal<HTMLIFrameElement>()
  const [overlayShown, setOverlayShown] = createSignal(true);

  const [timestamp, type] = props.save[2];
  const date = new Date(timestamp);

  const KEY = `save-${Number(date)}-${type}`;

  const $contextState = useContextState(KEY);
  const context = getContext(KEY);

  const year = date.getFullYear();

  const stringDate = () => capitalize(
    date.toLocaleDateString(props.language, {
      year: year === CURRENT_YEAR ? undefined : 'numeric',
      month: 'long',
      day: 'numeric',
      dayPeriod: 'narrow',
      hour: 'numeric',
      minute: 'numeric',
    })
  );

  const stringType = t(type === 'auto' ? 'Automatic' : 'Manual');

  const game = <Game
    controls='outside'
    skipTypewriterWhenGoingBack={true}

    $contextState={$contextState}

    context={context}
    store={useShared(KEY)}

    isPreview={true}
  />;

  const loadSave = () => {
    options.set(props.save)
  }

  const onIframeLoaded = () => {
    const { contentDocument } = iframe()!;

    if (!contentDocument) return;

    /**
     * - Set black background
     * - Lower font size so because of `rem` everything will get smaller
     * - Disable pointer events so it looks static
     */
    contentDocument.head.insertAdjacentHTML(
      'beforeend',
      `<style>:root { font-size: 30%; background: black; cursor: pointer; } * { pointer-events: none; } *, *::before, *::after { animation-play-state: paused !important; }</style><style>${stylesheet()}</style>`
    );

    context.root = contentDocument.body;

    contentDocument.body.appendChild(game as HTMLElement);

    options.preview(props.save, KEY);
  }

  createEffect(() => {
    const iframeElement = iframe();

    if (!iframeElement) return;

    /**
     * When src set in JSX load event is not firing
     */
    iframeElement.setAttribute('src', 'about:blank')
    iframeElement.addEventListener('load', onIframeLoaded);
  });

  onCleanup(() => {
    const iframeElement = iframe();

    if (iframeElement) {
      iframeElement.removeEventListener('load', onIframeLoaded);
    }

    const state = useContextState(KEY);

    for (const custom of Object.values(state.get().custom)) {
      if (!custom) continue;

      try {
        custom.clear();
      } catch {}
    }

    removeContextState(KEY);
    removeContext(KEY);
    options.removeContext(KEY);
    removeShared(KEY);
  });

  const removeSave = (date: number) => {
		storageDataUpdate((prev) => {
			prev.saves = untrack(storageData).saves.filter((save) => save[2][0] !== date);

			return prev;
		});
	};

  /**
   * todo: using observer get shown items and load their background, after all are loaded, then remove overlay
   */
  const hideOverlayTimeoutID = setTimeout(() => {
    setOverlayShown(false);
  }, 300);

  onCleanup(() => clearTimeout(hideOverlayTimeoutID));

  return (
    <li class="saves__list-item">
      <div
        class="saves__list-item__load"
        role="button"
        tabindex="0"
        aria-label={t('LoadASaveFrom') + ' ' + stringDate()}

        onClick={loadSave}

        onKeyDown={(event) => {
          if (event.code === 'Enter') {
            loadSave()
          }
        }}

        onKeyUp={(event) => {
          if (event.code === 'Space') {
            loadSave();
          }
        }}
      >
        <Transition name="saves__list-item__overlay">
          <Show when={overlayShown()}>
            <div class="saves__list-item__overlay" />
          </Show>
        </Transition>

        <iframe
          loading="lazy"
          role="button"
          tabindex="-1"
          class="saves__list-item__iframe"
          ref={setIframe}
        />
      </div>

      <div class="saves__list-item__description">
        {/** There in information about date in remove and load aria-labels */}
        <div aria-hidden={true}>{stringDate()}</div>
        <div>{stringType}</div>
      </div>

      <button
        type="reset"
        class="button saves__button-reset"
        aria-label={t('DeleteASaveFrom') + ' ' + stringDate()}
        onClick={[removeSave, timestamp]}
      >
        <span>{t('Remove')}</span>
      </button>
    </li>
  );
};


export { Save };
