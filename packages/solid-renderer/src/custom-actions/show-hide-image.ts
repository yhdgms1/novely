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

const SHOW_HIDE_IMAGE = Symbol();

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

	const handler: CustomHandler = ({ contextKey, clear, flags, rendererContext }) => {
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

		if (wait && !flags.preview && !flags.restoring) {
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

	handler.id = SHOW_HIDE_IMAGE;
	handler.key = key;
	handler.assets = [asset];
	handler.skipOnRestore = (getNext) => {
		return getNext().some(
			(action) => action[0] === 'custom' && action[1].id === SHOW_HIDE_IMAGE && action[1].key === key,
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

	const handler: CustomHandler = ({ contextKey, rendererContext }) => {
		const ctx = useContextState(contextKey);
		const index = getIndex(ctx, key);

		const context = ctx.get().images[index];

		if (!context) {
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

		if (wait) {
			rendererContext.clearBlockingActions(undefined);
		} else {
			image.classList.remove(...classesBaseSplitted);
			resolve();
		}

		return promise;
	};

	handler.id = SHOW_HIDE_IMAGE;
	handler.key = key;
	handler.assets = [];
	handler.callOnlyLatest = true;

	return ['custom', handler] as ValidAction;
};

export { showImage, hideImage };
export type { ContextImages };
