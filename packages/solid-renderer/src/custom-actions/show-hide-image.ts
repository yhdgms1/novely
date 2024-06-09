import type { CustomHandler, ValidAction } from "@novely/core";
import { noop } from "@novely/renderer-toolkit";

// todo: use for images
// import { PRELOADED_IMAGE_MAP } from '../shared';
// import { canvasDrawImages, createImage } from "$utils";

const SHOW_IMAGE = Symbol();

type ShowImageParams = {
  z?: number;

  in?: string;

  class?: string;
  style?: string;

  position?: string;

  await?: boolean;
}

type ShowImageData = {
  image: HTMLImageElement

  in?: string;
}

const showImage = (source: string, params: ShowImageParams = {}) => {
  const handler: CustomHandler = ({ getDomNodes, clear, flags, data }) => {
    const { promise, resolve } = Promise.withResolvers<void>()
    const { element } = getDomNodes(true);

    {
      element.style.cssText += `position: fixed; inset: 0;`
      element.style.zIndex = String(params.z || 1);
    }

    const image = document.createElement('img');

    {
      image.src = source;
      image.className = params.class || '';
      image.style.cssText = params.style || '';
      image.style.cssText += `object-fit: cover; object-position: ${params.position || '50% 50%'}; width: 100vw; height: 100vh;`;
    }

    element.appendChild(image);

    data<ShowImageData>({
      image,
      in: params.in
    });

    let clearAnimation = noop;

    if (params.in && !flags.preview) {
      const classes = params.in.split(' ');

      image.classList.add(...classes);

      clearAnimation = () => {
        image.classList.remove(...classes);
        if (params.await) {
          resolve();
        }
      }

      image.addEventListener("animationend", clearAnimation, { once: true });
    }

    clear(() => {
      data({});
      clearAnimation();
      image.remove();
    })

    if (!params.await) {
      resolve();
    }

    return promise;
  }

  handler.id = SHOW_IMAGE;
  handler.key = source;
  handler.assets = [source];
  handler.skipOnRestore = (getNext) => {
    return getNext().some(([name, fn]) => name === 'custom' && fn.key === source);
  }

  return ['custom', handler] as ValidAction;
}

type HideImageParams = {
  out?: string;
  await?: boolean
}

const hideImage = (source: string, params: HideImageParams = {}) => {
  const handler: CustomHandler = async ({ data }) => {
    const { promise, resolve } = Promise.withResolvers<void>();

    const { image, in: inClasses } = data<ShowImageData>()

    if (!image) {
      resolve();
      return promise;
    }

    if (inClasses) {
      const classes = inClasses.split(' ');

      image.classList.remove(...classes);
    }

    if (params.out) {
      const classes = params.out.split(' ');

      image.classList.add(...classes);

      const onAnimationEnd = () => {
        image.classList.remove(...classes)

        if (params.await) {
          resolve();
        }
      }

      image.addEventListener("animationend", onAnimationEnd, { once: true });

      if (!params.await) {
        resolve();
      }
    } else {
      resolve();
    }

    return promise;
  }

  handler.id = SHOW_IMAGE;
  handler.key = source;
  handler.assets = [source];
  handler.skipOnRestore = (getNext) => {
    return getNext().some(([name, fn]) => name === 'custom' && fn.key === source);
  }

  return ['custom', handler] as ValidAction;
}

export { showImage, hideImage }
