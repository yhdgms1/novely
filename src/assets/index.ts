import type { NovelyAsset } from '@novely/core';
import { asset } from '@novely/core';
import { camelCase } from 'scule';

const image = (sources: string[]) => {
  return import.meta.env.DEV ? asset.image(sources[0]) : asset(...sources)
}

const extract = (input: Record<string, unknown>) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value && typeof value === 'object' && 'default' in value && Array.isArray(value.default)) {
      const name = camelCase(key.split('/').at(-1)!.split('.')[0]);

      acc[name] = image(value.default);
    }

    return acc;
  }, {} as Record<string, NovelyAsset>);
}

/**
 * Backgrounds can have an opaque background. Therefore, we will use avif, webp, and jpeg.
 *
 * It is also worth paying attention to `&effort=max` — with this part, the build takes a very long time.
 * It may seem that something is broken or frozen.
 * But in fact, the images are simply compressed as much as possible, and this takes time.
 */
const backgrounds = import.meta.glob('./backgrounds/*.png', {
  eager: true,
  query: '?format=avif;webp;jpeg'
});

/**
 * Characters must have a transparent background, so no jpegs.
 * I also decided not to include avif, as I didn't notice much difference with webp.
 */
const characters = import.meta.glob('./characters/*.png', {
  eager: true,
  query: '?format=webp;png'
});

export const { fountain, night } = extract(backgrounds);
export const {} = extract(characters);
