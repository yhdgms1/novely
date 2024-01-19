import type { Character } from './character';
import type { Thenable, NonEmptyRecord } from './types';

type ValidAction =
	| ['choice', [number]]
	| ['clear', [Set<keyof DefaultActionProxyProvider>?, Set<string>?]]
	| ['condition', [() => boolean, Record<string, ValidAction[]>]]
	| ['dialog', [string | undefined, Unwrappable<string>, string | undefined]]
	| ['end', []]
	| ['showBackground', [string | NonEmptyRecord<BackgroundImage>]]
	| ['playMusic', [string]]
	| ['stopMusic', [string]]
	| ['voice', [string]]
	| ['stopVoice', []]
	| ['jump', [string]]
	| ['showCharacter', [string, keyof Character['emotions'], string?, string?]]
	| ['hideCharacter', [string, string?, string?, number?]]
	| ['animateCharacter', [string, number, ...string[]]]
	| ['wait', [FunctionableValue<number>]]
	| ['function', [() => Thenable<void>]]
	| ['input', [string, (meta: ActionInputOnInputMeta) => void, ActionInputSetup?]]
	| ['custom', [CustomHandler]]
	| ['vibrate', [...number[]]]
	| ['next', []]
	| ['text', [...string[]]]
	| ['exit', []]
	| ['preload', [string]]
	| ['block', [string]]
	| ValidAction[];

type Story = Record<string, ValidAction[]>;

type Unwrappable<L extends string> = string | (() => string) | Record<L, string | (() => string)>;

type FunctionableValue<T> = T | (() => T);

type CustomHandlerGetResultDataFunction = {
	(data?: Record<string, unknown>): Record<string, unknown>;
};

type CustomHandlerGetResult<I extends boolean> = {
	delete: () => void;
	/**
	 * Данные
	 */
	data: CustomHandlerGetResultDataFunction;
	/**
	 * Элемент слоя
	 */
	element: I extends true ? HTMLDivElement : null;
	/**
	 * Корневой элемент Novely
	 */
	root: HTMLElement;
	/**
	 * Устанавливает обработчик очистки
	 */
	clear: (fn: () => void) => void;
};

type CustomHandlerFunction = (get: <I extends boolean>(insert?: I) => CustomHandlerGetResult<I>, goingBack: boolean, preview: boolean) => Thenable<void>;

type CustomHandler = CustomHandlerFunction & {
	callOnlyLatest?: boolean;
	requireUserAction?: boolean;
	skipClearOnGoingBack?: boolean;

	id?: string | symbol;

	key: string;
};

interface ActionInputOnInputMeta {
	/**
	 * Input Element itself
	 */
	input: HTMLInputElement;
	/**
	 * Function to show error message or hide it
	 * @param error Error message or empty string to remove it
	 */
	error: (error: string) => void;
	/**
	 * Input Event
	 */
	event: InputEvent & { currentTarget: HTMLInputElement };
	/**
	 * Sanitized `input.value`
	 */
	value: string;
}

type ActionInputSetup = (input: HTMLInputElement, cleanup: (cb: () => void) => void) => void;

type BackgroundImage = Partial<Record<'portrait' | 'landscape' | 'all', string>> & Record<string, string>;

type ActionProxyProvider<Characters extends Record<string, Character>, Languages extends string> = {
	choice: {
		(
			...choices: (
				| [Unwrappable<Languages>, ValidAction[]]
				| [Unwrappable<Languages>, ValidAction[], () => boolean]
			)[]
		): ValidAction;
		(
			question: Unwrappable<Languages>,
			...choices: (
				| [Unwrappable<Languages>, ValidAction[]]
				| [Unwrappable<Languages>, ValidAction[], () => boolean]
			)[]
		): ValidAction;
	};

	clear: (
		keep?: Set<keyof DefaultActionProxyProvider>,
		keepCharacters?: Set<string>,
		keepAudio?: {
			music: Set<string>,
			sounds: Set<string>
		}
	) => ValidAction;

	condition: <T extends string | true | false>(
		condition: () => T,
		variants: Record<T extends true ? 'true' : T extends false ? 'false' : T, ValidAction[]>,
	) => ValidAction;

	exit: () => ValidAction;

	dialog: {
		<C extends keyof Characters>(
			person: C,
			content: Unwrappable<Languages>,
			emotion?: keyof Characters[C]['emotions'],
		): ValidAction;
		(person: undefined, content: Unwrappable<Languages>, emotion?: undefined): ValidAction;
		(person: string, content: Unwrappable<Languages>, emotion?: undefined): ValidAction;
	};

	end: () => ValidAction;

	showBackground: <T extends string | BackgroundImage>(
		background: T extends string ? T : T extends Record<PropertyKey, unknown> ? NonEmptyRecord<T> : never,
	) => ValidAction;

	playMusic: (audio: string) => ValidAction;

	stopMusic: (audio: string) => ValidAction;

	playSound: (audio: string, loop?: boolean) => ValidAction;

	stopSound: (audio: string) => ValidAction;

	/**
	 * Plays voice
	 */
	voice: (voice: string) => ValidAction;
	/**
	 * Stops currently playing voice
	 */
	stopVoice: () => ValidAction;

	jump: (scene: string) => ValidAction;

	showCharacter: {
		<C extends keyof Characters>(
			character: C,
			emotion: keyof Characters[C]['emotions'],
			className?: string,
			style?: string,
		): ValidAction;
	};

	hideCharacter: (
		character: keyof Characters,
		className?: string,
		style?: string,
		duration?: number,
	) => ValidAction;

	animateCharacter: (character: keyof Characters, timeout: number, ...classes: string[]) => ValidAction;

	wait: (time: FunctionableValue<number>) => ValidAction;

	function: (fn: (restoring: boolean, goingBack: boolean, preview: boolean) => Thenable<void>) => ValidAction;

	input: (
		question: Unwrappable<Languages>,
		onInput: (meta: ActionInputOnInputMeta) => void,
		setup?: ActionInputSetup,
	) => ValidAction;

	custom: (handler: CustomHandler) => ValidAction;

	vibrate: (...pattern: number[]) => ValidAction;

	next: () => ValidAction;

	text: (...text: Unwrappable<Languages>[]) => ValidAction;

	preload: (source: string) => ValidAction;

	block: (scene: string) => ValidAction;
};

type DefaultActionProxyProvider = ActionProxyProvider<Record<string, Character>, string>;
type GetActionParameters<T extends Capitalize<keyof DefaultActionProxyProvider>> = Parameters<
	DefaultActionProxyProvider[Uncapitalize<T>]
>;

export type {
	ValidAction,
	Story,
	ActionProxyProvider,
	DefaultActionProxyProvider,
	GetActionParameters,
	Unwrappable,
	CustomHandler,
	CustomHandlerGetResult,
	CustomHandlerGetResultDataFunction,
	FunctionableValue,
	ActionInputOnInputMeta,
	BackgroundImage,
	ActionInputSetup
};
