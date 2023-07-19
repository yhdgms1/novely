const capitalize = (str: string) => {
  return str[0].toUpperCase() + str.slice(1);
}

const isCSSImage = (str: string) => {
  const startsWith = String.prototype.startsWith.bind(str);

  return startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data');
}

const createImage = (src: string) => {
  const img = document.createElement('img');

  return img.src = src, img.crossOrigin = '*', img;
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

const escaped: Record<string, string> = {
	'"': '&quot;',
	"'": '&#39;',
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;'
};

const escape = (str: string) => {
	return String(str).replace(/["'&<>]/g, match => escaped[match]);
}

const onKey = (cb: (event: KeyboardEvent) => void, ...keys: string[]) => {
  return (e: KeyboardEvent) => {
    if (keys.some(key => key === e.key)) {
      cb(e);
    }
  }
}

export { isCSSImage, canvasDrawImages, url, createImage, capitalize, escape, onKey }