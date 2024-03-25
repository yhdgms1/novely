import type { Character } from './character';
import type { Thenable, NonEmptyRecord, StateFunction, State } from './types';

type ValidAction =
	| ['choice', number]
	| ['clear', Set<keyof DefaultActionProxy>?, Set<string>?, { music: Set<string>, sounds: Set<string> }?]
	| ['condition', (state: State) => boolean, Record<string, ValidAction[]>]
	| ['dialog', string | undefined, TextContent<string, State>, string | undefined]
	| ['say', string, TextContent<string, State>]
	| ['end']
	| ['showBackground', string | NonEmptyRecord<BackgroundImage>]
	| ['playMusic', string]
	| ['stopMusic', string]
	| ['playSound', audio: string, loop?: boolean]
	| ['voice', string]
	| ['stopVoice']
	| ['jump', string]
	| ['showCharacter', string, keyof Character['emotions'], string?, string?]
	| ['hideCharacter', string, string?, string?, number?]
	| ['animateCharacter', string, number, ...string[]]
	| ['wait', (number | ((state: State) => number))]
	| ['function', FunctionAction<string, State>]
	| ['input', string, (meta: ActionInputOnInputMeta<string, State>) => void, ActionInputSetup?]
	| ['custom', CustomHandler<string, State>]
	| ['vibrate', ...number[]]
	| ['next']
	| ['text', ...TextContent<string, State>[]]
	| ['exit']
	| ['preload', string]
	| ['block', string]
	| ValidAction[];

type Story = Record<string, ValidAction[]>;

type TextContent<L extends string, S extends State> = string | ((state: S) => string) | Record<L, string | ((state: S) => string)>;

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

type CustomHandlerFunctionGetFn = <I extends boolean = true>(insert?: I) => CustomHandlerGetResult<I>;

type CustomHandlerFunctionParameters<L extends string, S extends State> = {
	get: CustomHandlerFunctionGetFn;
	state: StateFunction<S>;

	goingBack: boolean;
	preview: boolean;

	lang: L;
}

type CustomHandlerFunction<L extends string, S extends State> = (parameters: CustomHandlerFunctionParameters<L, S>) => Thenable<void>;

type CustomHandler<L extends string = string, S extends State = State> = CustomHandlerFunction<L, S> & {
	callOnlyLatest?: boolean;
	requireUserAction?: boolean;
	skipClearOnGoingBack?: boolean;

	id?: string | symbol;

	key: string;
};

interface ActionInputOnInputMeta<L extends string, S extends State> {
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
	/**
	 * Language
	 */
	lang: L;
	/**
	 * State function
	 */
	state: StateFunction<S>;
}

type FunctionActionProps<L extends string, S extends State> = {
	restoring: boolean;
	goingBack: boolean;
	preview: boolean;
	/**
	 * Language
	 */
	lang: L;
	/**
	 * State function
	 */
	state: StateFunction<S>;
}

type ChoiceCheckFunctionProps<L extends string, S extends State> = {
	/**
	 * Language
	 */
	lang: L;
	/**
	 * State
	 */
	state: S;
}

type ChoiceCheckFunction<L extends string, S extends State> = {
	(props: ChoiceCheckFunctionProps<L, S>): boolean;
}

type FunctionAction<L extends string, S extends State> = (props: FunctionActionProps<L, S>) => Thenable<void>;

type ActionInputSetup = (input: HTMLInputElement, cleanup: (cb: () => void) => void) => void;

type BackgroundImage = Partial<Record<'portrait' | 'landscape' | 'all', string>> & Record<string, string>;

type ActionProxy<Characters extends Record<string, Character>, Languages extends string, S extends State> = {
	choice: {
		(...choices: [name: TextContent<Languages, S>, actions: ValidAction[], active?: ChoiceCheckFunction<Languages, S>][]): ValidAction;
		(
			question: TextContent<Languages, S>,
			...choices: [name: TextContent<Languages, S>, actions: ValidAction[], active?: ChoiceCheckFunction<Languages, S>][]
		): ValidAction;
	};

	clear: (
		keep?: Set<keyof DefaultActionProxy>,
		keepCharacters?: Set<string>,
		keepAudio?: {
			music: Set<string>,
			sounds: Set<string>
		}
	) => ValidAction;

	condition: <T extends string | true | false>(
		condition: (state: S) => T,
		variants: Record<T extends true ? 'true' : T extends false ? 'false' : T, ValidAction[]>,
	) => ValidAction;

	exit: () => ValidAction;

	dialog: {
		<C extends keyof Characters>(
			character: C,
			content: TextContent<Languages, S>,
			emotion?: keyof Characters[C]['emotions'],
		): ValidAction;
		(character: undefined, content: TextContent<Languages, S>, emotion?: undefined): ValidAction;
		(character: string, content: TextContent<Languages, S>, emotion?: undefined): ValidAction;
	};

	say: (character: keyof Characters, content: TextContent<Languages, S>) => ValidAction;

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

	wait: (time: number | ((state: State) => number)) => ValidAction;

	function: (fn: FunctionAction<Languages, S>) => ValidAction;

	input: (
		question: TextContent<Languages, S>,
		onInput: (meta: ActionInputOnInputMeta<Languages, S>) => void,
		setup?: ActionInputSetup,
	) => ValidAction;

	custom: (handler: CustomHandler<Languages, S> | CustomHandler) => ValidAction;

	vibrate: (...pattern: number[]) => ValidAction;

	next: () => ValidAction;

	text: (...text: TextContent<Languages, S>[]) => ValidAction;

	preload: (source: string) => ValidAction;

	block: (scene: string) => ValidAction;
};

type DefaultActionProxy = ActionProxy<Record<string, Character>, string, State>;
type GetActionParameters<T extends Capitalize<keyof DefaultActionProxy>> = Parameters<
	DefaultActionProxy[Uncapitalize<T>]
>;

export type {
	ValidAction,
	Story,
	ActionProxy,
	DefaultActionProxy,
	GetActionParameters,
	TextContent,
	CustomHandler,
	CustomHandlerGetResult,
	CustomHandlerGetResultDataFunction,
	FunctionableValue,
	ActionInputOnInputMeta,
	BackgroundImage,
	ActionInputSetup,
	CustomHandlerFunctionGetFn,
	CustomHandlerFunctionParameters,
};
