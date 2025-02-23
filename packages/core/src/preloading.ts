import type { CustomHandler, DefaultActionProxy } from './action';
import type { Character } from './character';
import { ASSETS_TO_PRELOAD, PRELOADED_ASSETS } from './shared';
import type { Lang } from './types';
import { isAudioAction, isImageAsset, isString, isAsset, getResourseType, mapSet, toArray } from './utilities';
import { unwrapAudioAsset, unwrapImageAsset } from './asset';

const ACTION_NAME_TO_VOLUME_MAP = {
	playMusic: 'music',
	playSound: 'sound',
	voice: 'voice',
} as const;

/**
 * Adds asset to `ASSETS_TO_PRELOAD` firstly checking if is was already preloaded
 */
const enqueueAssetForPreloading = (asset: string) => {
	if (!PRELOADED_ASSETS.has(asset)) {
		ASSETS_TO_PRELOAD.add(asset);
	}
};

type HandleAssetsPreloadingOptions = {
	request: typeof fetch;

	limiter: (fn: () => void | PromiseLike<void>) => Promise<void>;

	preloadAudioBlocking: (source: string) => Promise<void>;
	preloadImageBlocking: (source: string) => Promise<void>;
};

/**
 * Preloads assets
 */
const handleAssetsPreloading = async ({
	request,
	limiter,
	preloadAudioBlocking,
	preloadImageBlocking,
}: HandleAssetsPreloadingOptions) => {
	const list = mapSet(ASSETS_TO_PRELOAD, (asset) => {
		return limiter(async () => {
			const type = await getResourseType({
				url: asset,
				request,
			});

			switch (type) {
				case 'audio': {
					await preloadAudioBlocking(asset);
					break;
				}

				case 'image': {
					await preloadImageBlocking(asset);
					break;
				}
			}

			ASSETS_TO_PRELOAD.delete(asset);
			PRELOADED_ASSETS.add(asset);
		});
	});

	/**
	 * `allSettled` is used because even if error happens game should run
	 *
	 * Ideally, there could be a notification for player, maybe developer could be also notified
	 * But I don't think it's really needed
	 */
	await Promise.allSettled(list);

	ASSETS_TO_PRELOAD.clear();
};

type HuntAssetsOptions = {
	/**
	 * Audio Volume
	 */
	volume: {
		music: number;
		sound: number;
		voice: number;
	};
	/**
	 * Current Language
	 */
	lang: Lang;
	/**
	 * Characters object from user config
	 */
	characters: Record<string, Character>;
	/**
	 * Action name
	 */
	action: keyof DefaultActionProxy;
	/**
	 * Action props
	 */
	props: Parameters<DefaultActionProxy[keyof DefaultActionProxy]>;
	/**
	 * Function to handle found asset
	 */
	handle: (asset: string) => void;
};

const huntAssets = ({ volume, lang, characters, action, props, handle }: HuntAssetsOptions) => {
	if (action === 'showBackground') {
		/**
		 * There are two types of showBackground currently
		 *
		 * Parameter is a `string`
		 * Parameter is a `Record<'CSS Media', string>`
		 */
		if (isString(props[0])) {
			handle(unwrapAudioAsset(props[0]));
		}

		if (props[0] && typeof props[0] === 'object') {
			for (const value of Object.values(props[0])) {
				if (isImageAsset(value)) {
					handle(value);
				} else if (isAsset(value)) {
					const unwrapped = unwrapImageAsset(value);

					if (isImageAsset(unwrapped)) {
						handle(unwrapped);
					}
				}
			}
		}

		return;
	}

	const getVolumeFor = (action: 'playMusic' | 'stopMusic' | 'playSound' | 'stopSound' | 'voice' | 'stopVoice') => {
		if (action in ACTION_NAME_TO_VOLUME_MAP) {
			// typescript don't be silly please
			return volume[ACTION_NAME_TO_VOLUME_MAP[action as keyof typeof ACTION_NAME_TO_VOLUME_MAP]];
		}

		return 0;
	};

	/**
	 * Here "stop" action also matches condition, but because `ASSETS_TO_PRELOAD` is a Set, there is no problem
	 */
	if (isAudioAction(action) && isString(props[0])) {
		if (getVolumeFor(action) > 0) {
			handle(unwrapAudioAsset(props[0]));
		}

		return;
	}

	if (action === 'voice' && typeof props[0] === 'object') {
		/**
		 * Early return in case of disabled voices
		 */
		if (getVolumeFor('voice') == 0) {
			return;
		}

		for (const [language, value] of Object.entries(props[0])) {
			if (language === lang) {
				/**
				 * todo: decide how to make language comparison (maybe use some function)
				 *
				 * We can use en-US for both en-US and en-GB. Same thing applies to `dialog` and `text` action.
				 * Maybe voice over language can be selected separately
				 */
				value && handle(unwrapAudioAsset(value));
			}
		}

		return;
	}

	/**
	 * Load characters
	 */
	if (action === 'showCharacter' && isString(props[0]) && isString(props[1])) {
		const images = toArray(characters[props[0]].emotions[props[1]]);

		for (const asset of images) {
			handle(unwrapImageAsset(asset));
		}

		return;
	}

	/**
	 * Custom action assets
	 */
	if (action === 'custom' && (props[0] as CustomHandler).assets) {
		for (const asset of (props[0] as CustomHandler).assets!) {
			isAsset(asset) ? handle(asset.source) : handle(asset);
		}

		return;
	}

	if (action === 'choice') {
		for (let i = 1; i < props.length; i++) {
			const data = props[i];

			if (Array.isArray(data)) {
				handle(unwrapImageAsset(data[5] as string));
			}
		}
	}
};

export { enqueueAssetForPreloading, handleAssetsPreloading, huntAssets };
