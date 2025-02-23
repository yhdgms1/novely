import { memoize } from 'es-toolkit/function';
import type { Lang } from '../types';

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

/**
 * Capitalizes the string
 * @param str String without emojis or complex graphemes
 */
const capitalize = (str: string) => {
	return str[0].toUpperCase() + str.slice(1);
};

export { getLanguage, getIntlLanguageDisplayName, capitalize };
