import type { CustomHandler } from '@novely/core';
import type { Container, IOptions, RecursivePartial } from '@tsparticles/engine';

let loaded = false;

const PARTICLES_ID = Symbol();

type ParticlesOptions = RecursivePartial<IOptions>;

type Data = {
	instance?: Container;
	unsubscribe?: () => void;
	options?: ParticlesOptions;
};

type TSParticles = {
	tsParticles: typeof import('@tsparticles/engine').tsParticles;
	loadSlim: typeof import('@tsparticles/slim').loadSlim;
};

type TSParticlesGetter = () => Promise<TSParticles>;

type ParticlesThis = {
	getParticles: TSParticlesGetter;
};

const withDefault = (options: ParticlesOptions) => {
	options.autoPlay ||= true;
	options.fullScreen ||= { enable: true, zIndex: 2 };

	return options;
};

const showParticles = function (this: ParticlesThis, options: ParticlesOptions): CustomHandler {
	const handler: CustomHandler = async ({ clear, data, getDomNodes, paused, flags: { goingBack, preview } }) => {
		if (preview) return;

		const { loadSlim, tsParticles } = await this.getParticles();

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

		const { element } = getDomNodes(true);

		// Remove previous instance
		clear(() => {
			// Get the instance
			const { instance, unsubscribe } = data<Data>();

			if (!instance) return;

			// Destroy the instance
			instance.destroy();

			// Unsubscribe from 'paused' listener
			if (unsubscribe) {
				unsubscribe();
			}

			// Empty the `data`
			data({});
		});

		const _data = data<Data>();

		const optionsEqual = _data.options === options;
		const instancePresent = Boolean(_data.instance);

		/**
		 * Skip re-rendering if:
		 * 1) Options has not changed and instance is present
		 * 2) Options has not changed and we are goingBack
		 */
		if (optionsEqual && instancePresent) return;
		if (optionsEqual && goingBack) return;

		/**
		 * We can not wait until particles is loaded
		 */
		const load = async () => {
			const instance = await tsParticles.load({
				element: element,
				options: withDefault(options),
			});

			const unsubscribe = paused.subscribe((paused) => {
				if (!instance) return;

				try {
					if (paused) {
						instance.pause();
					} else {
						instance.play();
					}
				} catch {}
			});

			data<Data>({ instance, options, unsubscribe });
		};

		/**
		 * Should be safe because in restore only latest is called, and when playing it is not expected to change frequently
		 */
		void load();
	};

	handler.callOnlyLatest = true;
	handler.id = PARTICLES_ID;
	handler.key = 'particles';

	return handler;
};

const hideParticles = () => {
	const handler: CustomHandler = ({ data, remove, flags: { preview } }) => {
		if (preview) return;

		/**
		 * Get the instance
		 */
		const { instance } = data<Data>();

		/**
		 * Destroy it
		 */
		if (instance) instance.destroy();

		/**
		 * Delete the layer
		 */
		remove();
	};

	handler.callOnlyLatest = true;
	handler.id = PARTICLES_ID;
	handler.key = 'particles';

	return handler;
};

export { showParticles, hideParticles };
