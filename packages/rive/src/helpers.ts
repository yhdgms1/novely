type Canvas2D = Omit<HTMLCanvasElement, 'getContext'> & {
  getContext(contextId: '2d', options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D;
}

const createCanvas2D = () => {
  const canvas = document.createElement('canvas') as unknown as Canvas2D;

  const context = canvas.getContext('2d', {
    willReadFrequently: true,
    alpha: true
  });

  if (context === null) {
    throw new Error('Could not get `context`');
  }

  canvas.getContext = function () {
    return context;
  }

  return canvas as unknown as HTMLCanvasElement;
}

export { createCanvas2D }
