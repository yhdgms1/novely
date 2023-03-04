import type { CustomHandler } from '@novely/core';

import * as styles from './styles';

interface VideoParameters {
  /**
   * Show video controls
   */
  controls?: boolean;
  /**
   * Close video automatically when it ended
   */
  close?: boolean
  /**
   * Loop the video. Parameter `close` will be ignored
   */
  loop?: boolean
  /**
   * Video URL
   */
  url: string
}

const createElement = <K extends keyof HTMLElementTagNameMap>(name: K, properties: HTMLElementTagNameMap[K][keyof HTMLElementTagNameMap[K]]): HTMLElementTagNameMap[K] => {
  return Object.assign(document.createElement(name), properties)
}

const video = ({ controls, close, loop, url }: VideoParameters): CustomHandler => {
  const handler: CustomHandler = (get, _, resolve) => {
    const { element, delete: remove } = get('n-video');

    element!.classList.add(styles.container);

    const video = createElement('video', {
      src: url,
      autoplay: 'autoplay',
      controls: controls ? 'controls' : undefined,
      loop: close ? undefined : loop ? 'loop' : undefined,
      className: styles.video,
    });

    const button = createElement('button', {
      type: 'button',
      innerHTML: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.75 6.75L19.25 12L13.75 17.25"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 12H4.75"></path></svg>`,
      ariaLabel: 'Next',
      className: styles.button,
    });

    const closeHandler = () => {
      video.removeEventListener('ended', closeHandler);
      button.removeEventListener('click', closeHandler);

      remove(), resolve();
    }

    /**
     * Video closes automatically if `close` is provided
     */
    if (close) video.addEventListener('ended', closeHandler, { once: true });
    /**
     * Button closes video anyway
     */
    button.addEventListener('click', closeHandler, { once: true });

    element!.append(video, button)
  };

  /**
   * Make the Novely wait until we click on the video or it ends
   */
  handler.requireUserAction = true;

  return handler;
}

export { video }