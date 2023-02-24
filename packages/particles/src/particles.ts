import type { SingleOrMultiple, RecursivePartial, IOptions, Container } from 'tsparticles-engine';
import type { CustomHandler } from '@novely/core';

import { tsParticles } from 'tsparticles-engine'
import { loadSlim } from 'tsparticles-slim'

let loaded = false;

type SingleParticlesOptions = RecursivePartial<IOptions>;
type ParticlesOptions = SingleOrMultiple<SingleParticlesOptions>;

const withDefault = (options: SingleParticlesOptions) => {
  options.autoPlay ||= true;
  options.fullScreen ||= { enable: true, zIndex: 2 };

  return options;
}

const particles = (options: ParticlesOptions): CustomHandler => {
  return async (get) => {
    if (!loaded) {
      /**
       * Load `tsParticles` in case it's not loaded
       */
      await loadSlim(tsParticles);
      /**
       * Do not load it later
       */
      loaded = true;
    }

    const layer = get('particles');

    /**
     * When `clear` when `goingBack`, do not call the `destroy` method
     */
    layer.skipClearOnGoingBack(true);

    /**
     * Remove previous instance
     */
    layer.clear(() => {
      /**
       * Get the instance
       */
      const instance = layer.data().instance as Container;

      if (!instance) return;

      /**
       * Destroy the instance
       */
      instance.destroy();

      /**
       * Empty the `data`
       */
      layer.data({});
    });

    /**
     * When restoring when `goingBack`, we should not re-create the `tsParticles`
     */
    if (layer.data().instance) return;

    const instance = await tsParticles.load('particles', Array.isArray(options) ? options.map(withDefault) : withDefault(options));

    /**
     * Set the instance
     */
    layer.data({ instance });
  }
}

const hide = (): CustomHandler => {
  return (get) => {
    const layer = get('particles');

    /**
     * Get the instance
     */
    const instance = layer.data().instance as Container;

    /**
     * Destroy it
     */
    if (instance) instance.destroy();

    /**
     * Delete the layer
     */
    layer.delete();
  }
}

export { particles, hide }