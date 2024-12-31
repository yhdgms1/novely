import type { CustomHandler, Lang, State, TextContent, ValidAction } from '@novely/core';
import { useContextState } from '../context-state';

const SET_MOOD = Symbol();

const setMood = (mood: string | TextContent<Lang, State>) => {
	const handler: CustomHandler = ({ contextKey, templateReplace, state, clear }) => {
		const ctx = useContextState(contextKey);

		if (mood === "''" || mood === '""' || mood === '') ctx.setKey('mood', '');
		else ctx.setKey('mood', templateReplace(mood, state()));

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
