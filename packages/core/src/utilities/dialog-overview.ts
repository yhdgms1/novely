import type { Story, TextContent } from '../action';
import { unwrapAudioAsset } from '../asset';
import type {
	Data,
	DialogOverview,
	DialogOverviewEntry,
	Lang,
	NovelyAsset,
	State,
	UseStackFunctionReturnType,
} from '../types';
import { getActionsFromPath, type GuardedReferFunction } from './actions-processing';
import { isAsset, isSkippedDuringRestore, isString, isUserRequiredAction } from './assertions';

type GetDialogOverviewContext = {
	story: Story;
	referGuarded: GuardedReferFunction;

	getCharacterName: (character: string) => string;
	getLanguage: () => string;
	getStack: () => UseStackFunctionReturnType;
	templateReplace: (content: TextContent<Lang, Data>, values?: Data) => string;
};

const getDialogOverview = async function (this: GetDialogOverviewContext) {
	/**
	 * Dialog Overview is possible only in main context
	 */
	const { value: save } = this.getStack();
	const stateSnapshots = save[3];

	/**
	 * Easy mode
	 */
	if (stateSnapshots.length == 0) {
		return [];
	}

	const { queue } = await getActionsFromPath({
		story: this.story,
		path: save[0],
		filter: false,
		referGuarded: this.referGuarded,
	});

	const lang = this.getLanguage();

	type DialogItem = {
		name: undefined | string;
		text: TextContent<string, State>;
		voice: undefined | string | NovelyAsset | Record<string, string | NovelyAsset>;
	};

	const dialogItems: DialogItem[] = [];

	/**
	 * For every available state snapshot find dialog corresponding to it
	 */
	for (let p = 0, a = stateSnapshots.length, i = queue.length - 1; a > 0 && i > 0; i--) {
		const action = queue[i];

		if (action[0] === 'dialog') {
			const [_, name, text] = action;

			let voice: undefined | string | NovelyAsset | Record<string, string | NovelyAsset> = undefined;

			/**
			 * Search for the most recent `voice` action before current dialog
			 */
			for (let j = i - 1; j > p && j > 0; j--) {
				const action = queue[j];

				if (isUserRequiredAction(action) || isSkippedDuringRestore(action[0])) break;
				if (action[0] === 'stopVoice') break;

				if (action[0] === 'voice') {
					voice = action[1];

					break;
				}
			}

			dialogItems.push({
				name,
				text,
				voice,
			});

			p = i;
			a--;
		}
	}

	const entries: DialogOverview = dialogItems.reverse().map(({ name, text, voice }, i) => {
		const state = stateSnapshots[i];
		const audioSource = isString(voice)
			? voice
			: isAsset(voice)
				? voice
				: voice == undefined
					? voice
					: voice[lang];

		name = name ? this.getCharacterName(name) : '';

		return {
			name: this.templateReplace(name, state),
			text: this.templateReplace(text, state),
			voice: audioSource ? unwrapAudioAsset(audioSource) : '',
		} satisfies DialogOverviewEntry;
	});

	return entries;
};

export { getDialogOverview };
