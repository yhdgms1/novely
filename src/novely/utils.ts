const capitalize = <T extends string>(str: T): Capitalize<T> => {
  return str[0].toUpperCase() + str.slice(1) as Capitalize<T>
}

const createElement = document.createElement.bind(document);

const createImage = (src: string) => {
  const img = createElement('img');

  return img.src = src, img;
}

const url = <T extends string>(str: T): `url(${T})` => {
  return `url(${str})`;
}

/**
 * Рисует `images` на `canvas`
 */
const canvasDrawImages = (canvas = createElement('canvas'), ctx = canvas.getContext('2d')!, images: HTMLImageElement[]) => {
  let set = false;

  for (const image of images) {
    const isLoaded = image.complete && image.naturalHeight !== 0;

    const draw = () => {
      if (!set) set = true, canvas.width = image.naturalWidth, canvas.height = image.naturalHeight;

      ctx.drawImage(image, 0, 0);
      image.removeEventListener('load', draw);
    }

    isLoaded ? draw() : image.addEventListener('load', draw);
  }

  return [canvas, ctx] as const;
}

export { capitalize, createElement, createImage, url, canvasDrawImages }