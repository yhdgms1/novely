const capitalize = (str: string) => {
  return str[0].toUpperCase() + str.slice(1);
}

const isCSSImage = (str: string) => {
  const startsWith = String.prototype.startsWith.bind(str);

  return startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data');
}

const createImage = (src: string) => {
  const img = document.createElement('img');

  return img.src = src, img;
}

/**
 * Рисует `images` на `canvas`
 */
const canvasDrawImages = (canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')!, images: HTMLImageElement[]) => {
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

const url = <T extends string>(str: T): `url(${T})` => {
  return `url(${str})`;
}

export { isCSSImage, canvasDrawImages, url, createImage, capitalize }