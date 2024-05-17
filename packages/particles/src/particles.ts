import type { RecursivePartial, IOptions, Container } from '@tsparticles/engine';
import type { CustomHandler } from '@novely/core';

import { tsParticles } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

let loaded = false;

const ID = Symbol();

type ParticlesOptions = RecursivePartial<IOptions>;

const withDefault = (options: ParticlesOptions) => {
	options.autoPlay ||= true;
	options.fullScreen ||= { enable: true };

	return options;
};

const createUniqId = (() => {
	let c = 0;

	return () => {
		return `np-${c++}`;
	}
})();

const showParticles = (options: ParticlesOptions): CustomHandler => {
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

		const { element, clear, data } = get(true);

		/**
		 * Remove previous instance
		 */
		clear(() => {
			/**
			 * Get the instance
			 */
			const instance = data().instance as Container;

			if (!instance) return;

			/**
			 * Destroy the instance
			 */
			instance.destroy();

			/**
			 * Empty the `data`
			 */
			data({});
		});

		const optionsEqual = data().options === options;

		/**
		 * Skip re-rendering if:
		 * 1) Options has not changed and instance is present
		 * 2) Options has not changed and we are goingBack
		 */
		if (optionsEqual && Boolean(data().instance)) return;
		if (optionsEqual && goingBack) return;

		const id = createUniqId();

		/**
		 * We can not wait until particles is loaded
		 */
		const load = async () => {
			const instance = await tsParticles.load({
				id: id,
				element: element,
				options: withDefault(options)
			});

			if (instance && instance.canvas.element) {
				instance.canvas.element.style.setProperty('z-index', '2')
			}

			data({ instance, options });
		}

		/**
		 * Should be safe because in restore only latest is called, and when playing it is not expected to change frequently
		 */
		void load();
	};

	handler.callOnlyLatest = handler.skipClearOnGoingBack = true;
	handler.id = ID;
	handler.key = 'particles';

	return handler;
};

const hideParticles = () => {
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
		layer.remove();
	};

	handler.callOnlyLatest = true;
	handler.id = ID;
	handler.key = 'particles';

	return handler;
};

export { showParticles, hideParticles };
