import type { VoidComponent } from 'solid-js';
import type { Save as NovelySave } from '@novely/core';
import { Show, createSignal, createEffect, onCleanup, untrack } from 'solid-js';
import { render } from 'solid-js/web';
import { Transition } from 'solid-transition-group';
import { useData } from '$context';
import { capitalize, getDocumentStyles, isCSSImage, once } from '$utils';
import { createRetrieved } from "retrieved";
import { removeContextState, useContextState } from '../context-state'
import { useShared, removeShared, PRELOADED_IMAGE_MAP } from '../shared';
import { Game } from '$screens';
import { noop } from '@novely/renderer-toolkit';

/**
 * When year changes page reload will be needed to render correctly but no one will notice
 */
const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();

const stylesheet = createRetrieved(getDocumentStyles);

interface SaveProps {
  save: NovelySave;
  language: string;

  observed: boolean;
  overlayShown: boolean;

  onPreviewDone: () => void;
}

const Save: VoidComponent<SaveProps> = (props) => {
  const { t, options, getContext, storageData, storageDataUpdate, removeContext } = useData();
  const [iframe, setIframe] = createSignal<HTMLIFrameElement>()
  const [iframeLoaded, setIframeLoaded] = createSignal(false);
  const [previewStarted, setPreviewStarted] = createSignal(false);

  let previewDoneTimeoutId: number;

  const previewDone = once(() => {
    /**
     * 150-ms delay is for situation when background is loaded but not everything done yet
     */
    previewDoneTimeoutId = setTimeout(() => {
      untrack(props.onPreviewDone);
    }, 150);
  });

  const [timestamp, type] = props.save[2];
  const date = new Date(timestamp);

  const KEY = `save-${timestamp}-${type}`;

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

  const loadSave = () => {
    options.set(props.save)
  }

  const removeSave = (date: number) => {
		storageDataUpdate((prev) => {
			prev.saves = untrack(storageData).saves.filter((save) => save[2][0] !== date);

			return prev;
		});
	};

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

    setIframeLoaded(true);
  }

  let dispose = noop;

  createEffect(() => {
    if (props.observed && iframeLoaded() && !previewStarted()) {
      setPreviewStarted(true);

      dispose = render(() => {
        return (
          <Game
            controls='outside'
            skipTypewriterWhenGoingBack={true}

            $contextState={$contextState}

            context={context}
            store={useShared(KEY)}

            isPreview={true}
          />
        )
      }, context.root);

      options.preview(props.save, KEY).then(() => {
        /**
         * Right now there is no way to know that everything is loaded (including characters)
         * We only check background here
         */
        const background = useContextState(KEY).get().background.background;

        if (!background || !isCSSImage(background)) {
          return previewDone();
        }

        if (PRELOADED_IMAGE_MAP.has(background)) {
          return previewDone();
        }

        const backgroundElement = context.root.querySelector<HTMLImageElement>('img.background');

        if (!backgroundElement) {
          return previewDone();
        }

        if (backgroundElement.complete && backgroundElement.naturalHeight !== 0) {
          return previewDone();
        }

        const onLoadingStatusChange = () => {
          backgroundElement.removeEventListener('load', onLoadingStatusChange);
          backgroundElement.removeEventListener('error', onLoadingStatusChange);

          previewDone();
        }

        backgroundElement.addEventListener('load', onLoadingStatusChange);
        backgroundElement.addEventListener('error', onLoadingStatusChange);
      })
    }
  })

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

  onCleanup(() => {
    clearTimeout(previewDoneTimeoutId);
    dispose();
  });

  return (
    <li
      class="saves__list-item"
      data-timestamp={timestamp}
    >
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
          <Show when={props.overlayShown}>
            <div class="saves__list-item__overlay" />
          </Show>
        </Transition>

        <Show when={props.observed} fallback={<div class="saves__list-item__iframe" />}>
          <iframe
            loading="lazy"
            tabindex="-1"
            class="saves__list-item__iframe"
            ref={setIframe}
          />
        </Show>
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
