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
    const layer = get('n-video');

    layer.element.classList.add(styles.container);

    const video = createElement('video', {
      src: url,
      autoplay: 'autoplay',
      controls: controls ? 'controls' : undefined,
      loop: loop ? 'loop' : undefined,
      className: styles.video,
    });

    if (close) video.addEventListener('ended', resolve, { once: true });

    const button = createElement('button', {
      type: 'button',
      innerHTML: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.75 6.75L19.25 12L13.75 17.25"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 12H4.75"></path></svg>`,
      ariaLabel: 'Next',
      className: styles.button,
    });

    const onButtonClick = () => {
      video.removeEventListener('ended', resolve);
      button.removeEventListener('click', onButtonClick);
      
      layer.delete(), resolve();
    }

    button.addEventListener('click', onButtonClick, { once: true });

    layer.element.append(video, button)
  };

  handler.requireUserAction = true;

  return handler;
}

export { video }