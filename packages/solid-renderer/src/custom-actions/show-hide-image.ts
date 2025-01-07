import type { CustomHandler, ValidAction, NovelyAsset } from '@novely/core';
import { noop } from '@novely/renderer-toolkit';
import { useContextState } from '../context-state';
import { imagePreloadWithCachingNotComplete } from '$utils';

const getIndex = (ctx: ReturnType<typeof useContextState>, key: string) => {
	const images = ctx.get().images;
	const index = images.findIndex((value) => value.key === key);

	if (index === -1) {
		return images.length;
	}

	return index;
};

const SHOW_IMAGE = Symbol();
const HIDE_IMAGE = Symbol();

const SHOW_HIDE_IMAGE = new Set<any>([SHOW_IMAGE, HIDE_IMAGE]);

type ShowImageParams = {
	classesBase?: string;

	classesIn?: string;

	wait?: boolean;
};

type ShowImageData = {
	classesBase?: string[];

	classesIn?: string[];
	classesOut?: string[];

	key: string;
	image: HTMLImageElement;
	visible: boolean;

	onIn: () => void;
	onOut: () => void;
};

type ContextImages = ShowImageData[];

const showImage = (asset: NovelyAsset, { classesBase, classesIn, wait }: ShowImageParams = {}) => {
	const key = `show-image--${asset.id}`;

	const handler: CustomHandler = ({
		contextKey,
		clear,
		flags: { preview, restoring, goingBack },
		rendererContext,
	}) => {
		const { promise, resolve } = Promise.withResolvers<void>();
		const ctx = useContextState(contextKey);
		const index = getIndex(ctx, key);

		const image = imagePreloadWithCachingNotComplete(asset.source).cloneNode(true) as HTMLImageElement;

		const classesBaseSplitted = classesBase?.split(' ') || [];
		const classesInSplitted = classesIn?.split(' ') || [];

		image.classList.add(...classesBaseSplitted);
		image.classList.add('action-image__image');

		const onIn = () => {
			if (wait) {
				resolve();
			}
		};

		ctx.mutate((s) => s.images[index], {
			classesBase: classesBaseSplitted,
			classesIn: classesInSplitted,
			classesOut: undefined,
			key,
			image,
			visible: false,
			onIn,
			onOut: noop,
		});

		setTimeout(() => ctx.mutate((s) => s.images[index].visible, true));

		if (wait && preview) {
			resolve();
		} else if (wait && (!restoring || !goingBack)) {
			rendererContext.clearBlockingActions(undefined);
		} else {
			resolve();
		}

		clear(() => {
			ctx.mutate((s) => s.images[index], {
				classesIn: undefined,
				classesOut: undefined,
				key,
				image,
				visible: false,
				onIn: noop,
				onOut: noop,
			});

			image.classList.remove(...classesBaseSplitted);
		});

		return promise;
	};

	handler.id = SHOW_IMAGE;
	handler.key = key;
	handler.assets = [asset];
	handler.skipOnRestore = (next) => {
		return next.some(
			(action) => action[0] === 'custom' && SHOW_HIDE_IMAGE.has(action[1].id) && action[1].key === key,
		);
	};

	return ['custom', handler] as ValidAction;
};

type HideImageParams = {
	classesOut?: string;
	wait?: boolean;
};

const hideImage = (asset: NovelyAsset, { classesOut, wait }: HideImageParams = {}) => {
	const key = `show-image--${asset.id}`;

	const handler: CustomHandler = ({ contextKey, flags: { restoring, goingBack, preview } }) => {
		const ctx = useContextState(contextKey);
		const index = getIndex(ctx, key);

		const context = ctx.get().images[index];

		if (!context) {
			return;
		}

		if (!context.visible) {
			return;
		}

		const { promise, resolve } = Promise.withResolvers<void>();
		const { image, classesBase } = context;

		const classesBaseSplitted = classesBase || [];
		const classesOutSplitted = classesOut?.split(' ') || [];

		const onOut = () => {
			if (wait) {
				image.classList.remove(...classesBaseSplitted);
				resolve();
			}
		};

		ctx.mutate(
			(s) => s.images[index],
			(prev) => {
				return {
					...prev,
					onOut,
					classesOut: classesOutSplitted,
				};
			},
		);

		setTimeout(() => ctx.mutate((s) => s.images[index].visible, false));

		if (wait && preview) {
			resolve();
		} else if (wait && (!restoring || !goingBack)) {
			//
		} else {
			image.classList.remove(...classesBaseSplitted);
			resolve();
		}

		return promise;
	};

	handler.id = HIDE_IMAGE;
	handler.key = key;
	handler.assets = [];
	handler.callOnlyLatest = true;

	return ['custom', handler] as ValidAction;
};

export { showImage, hideImage };
export type { ContextImages };
