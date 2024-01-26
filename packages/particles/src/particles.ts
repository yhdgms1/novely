import type { RecursivePartial, IOptions, Container } from 'tsparticles-engine';
import type { CustomHandler } from '@novely/core';

import { tsParticles } from 'tsparticles-engine';
import { loadSlim } from 'tsparticles-slim';

let loaded = false;

const ID = Symbol();

type ParticlesOptions = RecursivePartial<IOptions>;

const withDefault = (options: ParticlesOptions) => {
	options.autoPlay ||= true;
	options.fullScreen ||= { enable: true, zIndex: 2 };

	return options;
};

const createUniqId = (() => {
	let c = 0;

	return () => {
		return `np-${c++}`;
	}
})();

const particles = (options: ParticlesOptions): CustomHandler => {
	const handler: CustomHandler = async ({ get, goingBack, preview }) => {
		if (preview) return;

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

		const layer = get(true);

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

		const data = layer.data();
		const optionsEqual = data.options === options;

		/**
		 * Skip re-rendering if:
		 * 1) Options has not changed and instance is present
		 * 2) Options has not changed and we are goingBack
		 */
		if (optionsEqual && Boolean(data.instance)) return;
		if (optionsEqual && goingBack) return;

		const id = createUniqId();

		/**
		 * Use element
		 */
		const instance = await tsParticles.set(id, layer.element, withDefault(options))

		/**
		 * Set the instance
		 */
		layer.data({ instance, options });
	};

	handler.callOnlyLatest = handler.skipClearOnGoingBack = true;
	handler.id = ID;
	handler.key = 'particles';

	return handler;
};

const hide = () => {
	const handler: CustomHandler = ({ get, preview }) => {
		if (preview) return;

		const layer = get(true);

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
	};

	handler.callOnlyLatest = true;
	handler.id = ID;
	handler.key = 'particles';

	return handler;
};

export { particles, hide };
