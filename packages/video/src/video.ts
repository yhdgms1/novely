import type { CustomHandler } from '@novely/core';

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

const video = ({ controls, close, loop, url }: VideoParameters): CustomHandler => {
  const handler: CustomHandler = (get, _, resolve) => {
    const layer = get('n-video');

    const root = document.createElement('video');

    root.src = url;

    layer.element.appendChild(root);

    const button = document.createElement('button');

    button.textContent = 'next';
    button.onclick = resolve;

    layer.element.appendChild(button)

    console.log(layer)
  };

  // handler.requireUserAction = loop ? false : !close;
  handler.requireUserAction = true;

  return handler;
}

export { video }