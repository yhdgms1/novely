import type { CustomHandler, ValidAction, NovelyAsset } from '@novely/core';
import { noop } from '@novely/renderer-toolkit';
import { useContextState } from '../context-state';

// todo: refactor

const SHOW_IMAGE = Symbol();

type ShowImageParams = {
	z?: number;

	in?: string;

	class?: string;
	style?: string;

	await?: boolean;
};

type ShowImageData = {
	image: HTMLImageElement;
	inClasses: string[];
};

const showImage = (source: string | NovelyAsset, params: ShowImageParams = {}) => {
	const handler: CustomHandler = ({ contextKey, clear, flags, data, rendererContext }) => {
		const ctx = useContextState(contextKey);

		const { promise, resolve } = Promise.withResolvers<void>();

		const image = document.createElement('img');
		const src = typeof source === 'object' ? source.source : source;

		{
			image.src = src;
			image.className = 'action-image__image ' + (params.class || '');
			image.style.cssText = params.style || '';
			image.style.setProperty('--z-index', String(params.z || 1));
		}

		ctx.mutate((s) => s.images[src], image);

		const inClasses = params.in ? params.in.split(' ') : [];

		data<ShowImageData>({
			image,
			inClasses,
		});

		let clearAnimation = noop;

		if (params.in && !flags.preview) {
			image.classList.add(...inClasses);

			// In case we will await for animation then we need to manually "clear" (remove) actions on the screen
			// I think it will not clear "blocking" custom actions
			// todo: implement
			if (params.await) {
				rendererContext.clearBlockingActions(undefined);
			}

			clearAnimation = () => {
				image.classList.remove(...inClasses);
				resolve();
			};

			image.addEventListener('animationend', clearAnimation, { once: true });
		} else {
			resolve();
		}

		clear(() => {
			data({});
			clearAnimation();
		});

		if (!params.await) {
			resolve();
		}

		return promise;
	};

	handler.id = SHOW_IMAGE;
	handler.key = typeof source === 'object' ? source.id : source;
	handler.assets = [source];
	handler.callOnlyLatest = true;

	return ['custom', handler] as ValidAction;
};

type HideImageParams = {
	out?: string;
	await?: boolean;
};

const hideImage = (source: string | NovelyAsset, params: HideImageParams = {}) => {
	const handler: CustomHandler = async ({ data, rendererContext, contextKey, flags }) => {
		const ctx = useContextState(contextKey);
		const { promise, resolve } = Promise.withResolvers<void>();

		const done = () => {
			ctx.mutate((s) => s.images[typeof source === 'object' ? source.source : source], undefined);
			resolve();
		};

		const { image, inClasses } = data<ShowImageData>();

		if (!image) {
			resolve();
			return promise;
		}

		if (inClasses) {
			image.classList.remove(...inClasses);
		}

		if (params.out && !flags.preview) {
			const classes = params.out.split(' ');

			image.classList.add(...classes);

			rendererContext.clearBlockingActions(undefined);

			const onAnimationEnd = () => {
				image.classList.remove(...classes);
				done();
			};

			image.addEventListener('animationend', onAnimationEnd, { once: true });

			if (!params.await) {
				done();
			}
		} else {
			done();
		}

		return promise;
	};

	handler.id = SHOW_IMAGE;
	handler.key = typeof source === 'object' ? source.id : source;
	// We're gonna hide image, we do not need to preload assets
	handler.assets = [];
	handler.callOnlyLatest = true;

	return ['custom', handler] as ValidAction;
};

export { showImage, hideImage };
