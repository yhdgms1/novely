import { DEV } from 'esm-env';
import type { ActionChoiceChoiceObject, DefaultActionProxy, ValidAction, VirtualActions } from '../action';
import { flatActions } from './story';
import type { Data, Lang, State } from '../types';
import type { Character } from '../character';

type BuildActionObjectParams<$Lang extends Lang, $Data extends Data> = {
	rendererActions: Record<string, (...args: any[]) => ValidAction>;
	nativeActions: string[];

	characters: Record<string, Character>;
};

type VirtualActionsGlobal = VirtualActions<Record<string, Character>, Lang, State>;
type ActionsGlobal = DefaultActionProxy & VirtualActionsGlobal;

/**
 * In this case actions that get overwritten with another action
 */
const VIRTUAL_ACTIONS: (keyof VirtualActionsGlobal)[] = ['say'];

const buildActionObject = <$Lang extends Lang, $Data extends Data>({
	rendererActions,
	nativeActions,
	characters,
}: BuildActionObjectParams<$Lang, $Data>) => {
	const allActions = [...nativeActions, ...VIRTUAL_ACTIONS];
	const object = { ...rendererActions };

	for (let action of allActions) {
		object[action] = (...props: Parameters<ActionsGlobal[keyof ActionsGlobal]>) => {
			if (action === 'say') {
				action = 'dialog';

				const [character] = props as Parameters<VirtualActionsGlobal['say']>;

				if (DEV && !characters[character]) {
					throw new Error(`Attempt to call Say action with unknown character "${character}"`);
				}
			} else if (action === 'choice') {
				if (props.slice(1).every((choice) => !Array.isArray(choice))) {
					for (let i = 1; i < props.length; i++) {
						const choice = props[i] as ActionChoiceChoiceObject<Lang, State>;

						(props as Parameters<DefaultActionProxy['choice']>)[i] = [
							choice.title,
							flatActions(choice.children),
							choice.active,
							choice.visible,
							choice.onSelect,
							choice.image,
						];
					}
				} else {
					for (let i = 1; i < props.length; i++) {
						const choice = props[i];

						if (Array.isArray(choice)) {
							choice[1] = flatActions(choice[1]);
						}
					}
				}
			} else if (action === 'condition') {
				const actions = (props as Parameters<ActionsGlobal['condition']>)[1];

				for (const key in actions) {
					actions[key] = flatActions(actions[key]);
				}
			}

			return [action, ...props] as ValidAction;
		};
	}

	return object;
};

export { buildActionObject };
