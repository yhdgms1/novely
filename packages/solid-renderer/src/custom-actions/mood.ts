import type { CustomHandler, Lang, ValidAction } from '@novely/core';
import { useContextState } from '../context-state';

const SET_MOOD = Symbol();

const setMood = (mood: string | Record<Lang, string>) => {
	// todo: provive `templateReplace` function from core and use it there

	const handler: CustomHandler = ({ contextKey, lang, clear }) => {
		const ctx = useContextState(contextKey);

		if (mood === "''" || mood === '""') ctx.setKey('mood', '');
		else ctx.setKey('mood', typeof mood === 'object' ? mood[lang] : mood);

		clear(() => {
			ctx.setKey('mood', '');
		});
	};

	handler.id = SET_MOOD;
	handler.key = 'set-mood';
	handler.callOnlyLatest = true;

	return ['custom', handler] as ValidAction;
};

export { setMood };
