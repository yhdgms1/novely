import type { VoidComponent } from 'solid-js';
import type { Save as NovelySave } from '@novely/core';
import { Portal } from 'solid-js/web';
import { Show, createSignal, createEffect, onCleanup, untrack } from 'solid-js';
import { Transition } from 'solid-transition-group';
import { useData } from '$context';
import { capitalize, getDocumentStyles, imagePreloadWithCaching, once } from '$utils';
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

  createEffect(async () => {
    const ready = props.observed && iframeLoaded() && !previewStarted();

    if (!ready) return;

    setPreviewStarted(true);

    /**
     * Will not wait more than one second, that's already enough
     */
    setTimeout(() => {
      previewDone();
    }, 1000);

    try {
      const { assets } = await options.preview(props.save, KEY);

      /**
       * Less promises
       */
      if (assets.length === 0) {
        return previewDone();
      }

      /**
       * No reason to limit parallel execution. But it can be done.
       */
      const promises = assets.map(async (asset) => {
        const type = await options.getResourseType(asset);

        if (type === 'image') {
          await imagePreloadWithCaching(asset);
        }
      });

      await Promise.allSettled(promises);

      previewDone();
    } catch {
      previewDone()
    }
  })

  onCleanup(() => {
    const state = useContextState(KEY);

    for (const custom of Object.values(state.get().custom)) {
      if (!custom) continue;

      try {
        options.clearCustomAction(context, custom.fn);
      } catch {}
    }

    removeContextState(KEY);
    removeContext(KEY);
    options.removeContext(KEY);
    removeShared(KEY);
  });

  onCleanup(() => {
    clearTimeout(previewDoneTimeoutId);
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
            loading={undefined /** "lazy" is broken on Firefox Mobile as of now (06.05.2024) */}

            tabindex="-1"
            class="saves__list-item__iframe"
            ref={setIframe}

            src="about:blank"
            onLoad={() => {
              onIframeLoaded();
            }}
          />

          <Show when={iframeLoaded()}>
            <Portal mount={context.root}>
              <Game
                controls='outside'
                skipTypewriterWhenGoingBack={true}

                $contextState={$contextState}

                context={context}
                store={useShared(KEY)}

                isPreview={true}
              />
            </Portal>
          </Show>
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
