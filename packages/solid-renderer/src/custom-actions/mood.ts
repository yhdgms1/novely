import type { CustomHandler, ValidAction } from '@novely/core';
import { useContextState } from '../context-state';

const SET_MOOD = Symbol();

const setMood = (mood: string) => {
	const handler: CustomHandler = ({ contextKey, clear }) => {
		const ctx = useContextState(contextKey);

		if (mood === "''" || mood === '""') ctx.setKey('mood', '');
		else ctx.setKey('mood', mood);

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
