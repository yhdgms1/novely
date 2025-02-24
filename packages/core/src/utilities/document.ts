import type { Lang } from '../types';

const setDocumentLanguage = (language: Lang) => {
	document.documentElement.lang = language;
};

export { setDocumentLanguage };
