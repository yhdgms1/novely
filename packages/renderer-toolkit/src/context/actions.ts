import type {
	ActionInputOnInputMeta,
	ActionInputSetup,
	ChoiceOnSelectFunction,
	Context,
	CustomActionHandle,
	CustomHandler,
	DefaultActionProxy,
	RendererInit,
	State,
	Stored,
} from '@novely/core';
import type { DeepAtom } from '../atoms/deep-atom';
import type { ContextState, ContextStateStore } from '../state/context-state';
import type { RendererStateStore } from '../state/renderer-state';

import { escapeHTML, noop } from '../utils';
import { useBackground } from './background';
import { vibrate } from './vibrate';

const allEmpty = (target: object | string | number | null | undefined) => {
	if (typeof target === 'string') {
		return target == '';
	}

	if (typeof target === 'number') {
		return target == 0;
	}

	if (!target) {
		return true;
	}

	if (Array.isArray(target) && target.length > 0) {
		for (const inner of target) {
			if (!allEmpty(inner)) {
				return false;
			}
		}
	}

	for (const value of Object.values(target)) {
		if (!allEmpty(value)) {
			return false;
		}
	}

	return true;
};

const handleBackgroundAction = (
	$contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>,
	background: Record<string, string>,
) => {
	$contextState.get().background.clear?.();

	const { dispose } = useBackground(background, (value) => {
		$contextState.mutate((s) => s.background.background, value);
	});

	$contextState.mutate(
		(s) => s.background.clear!,
		() => dispose,
	);
};

const handleDialogAction = (
	$contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>,
	content: string,
	name: string,
	character: string | undefined,
	emotion: string | undefined,
	resolve: () => void,
) => {
	$contextState.mutate((s) => s.dialog, {
		content,
		name,
		miniature: {
			character,
			emotion,
		},
		visible: true,
		resolve,
	});
};

const handleChoiceAction = (
	$contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>,
	label: string,
	choices: [
		name: string,
		active: Stored<boolean>,
		visible: Stored<boolean>,
		onselect: () => void,
		image: string,
	][],
	resolve: (selected: number) => void,
) => {
	$contextState.mutate((s) => s.choice, { choices, label, resolve, visible: true });
};

const handleClearAction = (
	$rendererState: DeepAtom<RendererStateStore<Record<PropertyKey, unknown>>>,
	$contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>,
	options: RendererInit<any, any>,
	context: Context,
	keep: Set<keyof DefaultActionProxy>,
	keepCharacters: Set<string>,
) => {
	$rendererState.mutate((s) => s.exitPromptShown, false);

	if (!keep.has('showBackground')) {
		$contextState.mutate((s) => s.background.background, '#000');
	}

	if (!keep.has('choice')) {
		$contextState.mutate((s) => s.choice, {
			choices: [],
			visible: false,
			label: '',
		});
	}

	const inputCleanup = $contextState.get().input.cleanup;

	if (inputCleanup) {
		inputCleanup();
	}

	if (!keep.has('input')) {
		$contextState.mutate((s) => s.input, {
			element: null,
			label: '',
			visible: false,
			error: '',
		});
	}

	if (!keep.has('dialog')) {
		$contextState.mutate((s) => s.dialog, {
			visible: false,
			content: '',
			name: '',
			miniature: {},
		});
	}

	if (!keep.has('text')) {
		$contextState.mutate((s) => s.text, { content: '' });
	}

	for (const character of Object.keys($contextState.get().characters)) {
		if (!keepCharacters.has(character)) {
			$contextState.mutate((s) => s.characters[character]!, {
				style: undefined,
				visible: false,
			});
		}
	}
};

/**
 * You must return value returned by this function
 */
const handleCustomAction = (
	$contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>,
	fn: CustomHandler<string, State>,
): CustomActionHandle => {
	if (!$contextState.get().custom[fn.key]) {
		$contextState.mutate((s) => s.custom[fn.key]!, {
			fn,
			node: null,
		});
	}

	return {
		setMountElement(node) {
			$contextState.mutate(
				(s) => s.custom[fn.key]!,
				(state) => {
					return {
						...state,
						node,
					};
				},
			);
		},
		remove() {
			$contextState.mutate((s) => s.custom[fn.key], undefined);
		},
	};
};

const handleClearBlockingActions = (
	$contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>,
	preserve?: 'choice' | 'dialog' | 'input' | 'text' | undefined,
) => {
	const current = $contextState.get();

	if (preserve !== 'choice' && !allEmpty(current.choice)) {
		$contextState.mutate((s) => s.choice, {
			choices: [],
			visible: false,
			label: '',
		});
	}

	if (preserve !== 'input' && !allEmpty(current.input)) {
		$contextState.mutate((s) => s.input, {
			element: null,
			label: '',
			visible: false,
			error: '',
		});
	}

	if (preserve !== 'text' && !allEmpty(current.text)) {
		$contextState.mutate((s) => s.text, { content: '' });
	}

	if (preserve !== 'dialog' && !allEmpty(current.dialog)) {
		$contextState.mutate((s) => s.dialog, {
			visible: false,
			content: '',
			name: '',
			miniature: {},
		});
	}
};

const handleTextAction = (
	$contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>,
	content: string,
	resolve: () => void,
) => {
	$contextState.mutate((s) => s.text, { content, resolve });
};

const handleInputAction = (
	$contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>,
	options: RendererInit<any, any>,
	context: Context,
	label: string,
	onInput: (opts: ActionInputOnInputMeta<string, State>) => void,
	setup: ActionInputSetup,
	resolve: () => void,
) => {
	const error = (value: string) => {
		$contextState.mutate((s) => s.input.error, value);
	};

	const onInputHandler = (event: InputEvent & { currentTarget: HTMLInputElement }) => {
		let value: string | undefined;

		onInput({
			lang: options.storageData.get().meta[0],
			input,
			event,
			error,
			state: options.getStateFunction(context.id),
			get value() {
				if (value) return value;
				return (value = escapeHTML(input.value));
			},
		});
	};

	const input = document.createElement('input');

	input.setAttribute('type', 'text');
	input.setAttribute('name', 'novely-input');
	input.setAttribute('id', 'novely-input');
	input.setAttribute('required', 'true');
	input.setAttribute('autocomplete', 'off');

	// @ts-expect-error Type is actually correct
	!context.meta.preview && input.addEventListener('input', onInputHandler);

	$contextState.mutate((s) => s.input, {
		element: input,
		label,
		error: '',
		visible: true,
		cleanup: setup(input) || noop,
		resolve,
	});

	/**
	 * Initially run the fake input event to handle errors & etc
	 */
	!context.meta.preview && input.dispatchEvent(new InputEvent('input', { bubbles: true }));
};

const handleVibrateAction = vibrate;

export {
	handleBackgroundAction,
	handleDialogAction,
	handleChoiceAction,
	handleClearAction,
	handleCustomAction,
	handleClearBlockingActions,
	handleTextAction,
	handleInputAction,
	handleVibrateAction,
};
