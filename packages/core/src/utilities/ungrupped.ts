import { memoize } from 'es-toolkit/function';
import { DEV } from 'esm-env';
import type { Character } from '../character';
import type { Stored } from '../store';
import type { CharactersData, Lang, NovelyAsset, StorageData } from '../types';
import { isAsset } from './assertions';

const getLanguage = (languages: string[]) => {
	let { language } = navigator;

	if (languages.includes(language)) {
		return language;
	} else if (languages.includes((language = language.slice(0, 2)))) {
		return language;
	} else if ((language = languages.find((value) => navigator.languages.includes(value))!)) {
		return language;
	}

	/**
	 * We'v checked the `en-GB` format, `en` format, and maybe any second languages, but there were no matches
	 */
	return languages[0];
};

const noop = () => {};

/**
 * A wrapper on `fn` to make it run only once!
 * @param fn Function that needed to run no more than one time
 */
const once = (fn: () => void) => {
	let ran = false;

	return () => {
		if (ran) return;

		ran = true;
		fn();
	};
};

const mapSet = <T, K>(set: Set<T>, fn: (value: T, index: number, array: T[]) => K): K[] => {
	return [...set].map(fn);
};

/**
 * Capitalizes the string
 * @param str String without emojis or complex graphemes
 */
const capitalize = (str: string) => {
	return str[0].toUpperCase() + str.slice(1);
};

const getIntlLanguageDisplayName = memoize((lang: Lang) => {
	/**
	 * When using Intl fails we just return language key.
	 */
	try {
		const intl = new Intl.DisplayNames([lang], {
			type: 'language',
		});

		return intl.of(lang) || lang;
	} catch {
		return lang;
	}
});

const unwrapAsset = (asset: string | NovelyAsset) => {
	return isAsset(asset) ? asset.source : asset;
};

const handleAudioAsset = (asset: string | NovelyAsset) => {
	if (DEV && isAsset(asset) && asset.type !== 'audio') {
		throw new Error('Attempt to use non-audio asset in audio action', { cause: asset });
	}

	return unwrapAsset(asset);
};

const handleImageAsset = (asset: string | NovelyAsset) => {
	if (DEV && isAsset(asset) && asset.type !== 'image') {
		throw new Error('Attempt to use non-image asset in action that requires image assets', { cause: asset });
	}

	return unwrapAsset(asset);
};

const getCharactersData = <Characters extends Record<string, Character<Lang>>>(characters: Characters) => {
	const entries = Object.entries(characters);
	const mapped = entries.map(([key, value]) => [key, { name: value.name, emotions: Object.keys(value.emotions) }]);

	return Object.fromEntries(mapped) as CharactersData<Characters>;
};

const toArray = <T>(target: T | T[]) => {
	return Array.isArray(target) ? target : [target];
};

const getLanguageFromStore = <$Language extends Lang>(store: Stored<StorageData<$Language, any>>) => {
	return store.get().meta[0];
};

const getVolumeFromStore = <$Language extends Lang>(store: Stored<StorageData<$Language, any>>) => {
	const { meta } = store.get();

	return {
		music: meta[2],
		sound: meta[3],
		voice: meta[4],
	};
};

export {
	getLanguage,
	noop,
	once,
	mapSet,
	capitalize,
	getIntlLanguageDisplayName,
	handleAudioAsset,
	handleImageAsset,
	getCharactersData,
	toArray,
	getLanguageFromStore,
	getVolumeFromStore,
	unwrapAsset,
};
