import type { Character } from './character';
import type { Context } from './renderer';
import type { Lang, NonEmptyRecord, NovelyAsset, Path, State, StateFunction, Thenable } from './types';

type ValidAction =
	| ['choice', string | undefined, ...[string, unknown[], (() => boolean)?, (() => boolean)?, string?][]]
	| ['clear', Set<keyof DefaultActionProxy>?, Set<string>?, { music: Set<string>; sounds: Set<string> }?]
	| ['condition', (state: State) => boolean, Record<string, ValidAction[]>]
	| ['dialog', string | undefined, TextContent<string, State>, string | undefined]
	| ['end']
	| ['showBackground', string | NovelyAsset | BackgroundImage]
	| ['playMusic', string | NovelyAsset]
	| ['stopMusic', string | NovelyAsset]
	| ['pauseMusic', string | NovelyAsset]
	| ['playSound', audio: string | NovelyAsset, loop?: boolean]
	| ['pauseSound', string | NovelyAsset]
	| ['stopSound', string | NovelyAsset]
	| ['voice', string | NovelyAsset | Record<string, string | NovelyAsset>]
	| ['stopVoice']
	| ['jump', string]
	| ['showCharacter', string, keyof Character['emotions'], string?, string?]
	| ['hideCharacter', string, string?, string?, number?]
	| ['animateCharacter', string, number, ...string[]]
	| ['wait', number | ((state: State) => number)]
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

type TextContent<L extends string, S extends State> =
	| string
	| ((state: S) => string)
	| Record<L, string | ((state: S) => string)>;

type FunctionableValue<T> = T | (() => T);

type CustomHandlerGetResultDataFunction = <T = Record<string, unknown>>(data?: T) => T;

type CustomHandlerGetResult<I extends boolean> = {
	/**
	 * Element for the custom action to be rendered into
	 */
	element: I extends true ? HTMLDivElement : null;
	/**
	 * Root node
	 */
	root: HTMLElement;
};

type CustomHandlerFunctionGetFn = <I extends boolean = true>(insert?: I) => CustomHandlerGetResult<I>;

type CustomHandlerFunctionParameters<L extends string, S extends State> = {
	/**
	 * Returns:
	 * - Root where entire novely is mounted
	 * - Element in which custom action could be mounted
	 *
	 * @example
	 * ```ts
	 * // pass `true` to insert element to the DOM
	 * const { root, element } = getDomNodes(true);
	 * ```
	 */
	getDomNodes: CustomHandlerFunctionGetFn;

	/**
	 * Function to get current Path. Path can be mutated. Can be helpful when making complex custom actions.
	 *
	 * Only use it when you know what you do
	 */
	getPath: () => Path;

	/**
	 * Renderer Context
	 */
	rendererContext: Context;

	/**
	 * Context key in which action is running
	 */
	contextKey: string;

	/**
	 * Function to work with custom action's state
	 */
	data: CustomHandlerGetResultDataFunction;

	/**
	 * Function to set cleanup handler
	 */
	clear: (fn: () => void) => void;

	/**
	 * Remove's custom handler instance
	 */
	remove: () => void;

	/**
	 * Context's state function
	 */
	state: StateFunction<S>;

	/**
	 * Game flags (aka game states)
	 */
	flags: {
		restoring: boolean;
		goingBack: boolean;
		preview: boolean;
	};

	/**
	 * Game language
	 */
	lang: L;
};

type CustomHandlerFunction<L extends string, S extends State> = (
	parameters: CustomHandlerFunctionParameters<L, S>,
) => Thenable<void>;

type CustomHandlerCalling = {
	/**
	 * Call only the last custom action of this type or not. Does not affect other custom actions
	 * @example
	 * ```ts
	 * ['custom', customSomething1]
	 * ['custom', customSomething1]
	 * ['custom', customSomething1] <-- Run only that
	 * ```
	 */
	callOnlyLatest?: boolean;
	/**
	 * Manually check should be skipped or not during restore
	 * @param getNext Function which will return next actions in queue
	 */
	skipOnRestore?: (getNext: () => Exclude<ValidAction, ValidAction[]>[]) => boolean;
};

type CustomHandlerInfo = CustomHandlerCalling & {
	/**
	 * Assets (pictures, audio files) used by action
	 */
	assets?: (NovelyAsset | string)[];
	/**
	 * When true interacting with it will be saved in history
	 */
	requireUserAction?: boolean;
	/**
	 * When player is going back we clear every custom action. But we can ignore clearing that.
	 */
	skipClearOnGoingBack?: boolean;

	/**
	 * Id by which we will determine what action is which
	 */
	id: string | symbol;

	/**
	 * Key by which we will save the data in the `get` function provided to custom action.
	 *
	 * It can be a name of action or more specific thing. In example for custom `showCharacter` it may be `show-character-${character}
	 */
	key: string;
};

type CustomHandler<L extends string = string, S extends State = State> = CustomHandlerFunction<L, S> &
	CustomHandlerInfo;

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

type FunctionActionProps<L extends Lang, S extends State> = {
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
};

type ChoiceCheckFunctionProps<L extends Lang, S extends State> = {
	/**
	 * Language
	 */
	lang: L;
	/**
	 * State
	 */
	state: S;
};

type ChoiceOnSelectFunctionProps = {
	/**
	 * Triggers `active` and `visible` properties computation
	 */
	recompute: () => void;
};

type ChoiceCheckFunction<L extends Lang, S extends State> = (props: ChoiceCheckFunctionProps<L, S>) => boolean;
type ChoiceOnSelectFunction = (props: ChoiceOnSelectFunctionProps) => void;

type ConditionCheckFunction<S extends State, R extends string | true | false> = (state: S) => R;

type FunctionAction<L extends string, S extends State> = (props: FunctionActionProps<L, S>) => Thenable<void>;

type ActionInputSetupCleanup = () => void;
type ActionInputSetup = (input: HTMLInputElement) => ActionInputSetupCleanup | void;

type BackgroundImage = Record<string, string | NovelyAsset>;

type VoiceAction<L extends Lang> = (
	params: string | NovelyAsset | Partial<Record<L, string | NovelyAsset>>,
) => ValidAction;

type ActionChoiceChoiceObject<L extends Lang, S extends State> = {
	title: TextContent<L, S>;
	children: ValidAction[];
	active?: ChoiceCheckFunction<L, S>;
	visible?: ChoiceCheckFunction<L, S>;
	onSelect?: ChoiceOnSelectFunction;
	image?: string | NovelyAsset;
};

type ActionChoiceChoice<L extends Lang, S extends State> = [
	title: TextContent<L, S>,
	actions: ValidAction[],
	active?: ChoiceCheckFunction<L, S>,
	visible?: ChoiceCheckFunction<L, S>,
	onSelect?: ChoiceOnSelectFunction,
	image?: string | NovelyAsset,
];

type ActionProxy<Characters extends Record<string, Character>, Languages extends Lang, S extends State> = {
	choice: {
		(...choices: ActionChoiceChoice<Languages, S>[]): ValidAction;
		(question: TextContent<Languages, S>, ...choices: ActionChoiceChoice<Languages, S>[]): ValidAction;
	};

	clear: (
		keep?: Set<keyof DefaultActionProxy>,
		keepCharacters?: Set<string>,
		keepAudio?: {
			music: Set<string>;
			sounds: Set<string>;
		},
	) => ValidAction;

	condition: <T extends string | true | false>(
		condition: ConditionCheckFunction<S, T>,
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

	end: () => ValidAction;

	showBackground: {
		(background: string | NovelyAsset): ValidAction;
		<T extends Record<string, string | NovelyAsset>>(background: NonEmptyRecord<T>): ValidAction;
	};

	playMusic: (audio: string | NovelyAsset) => ValidAction;
	pauseMusic: (audio: string | NovelyAsset) => ValidAction;
	stopMusic: (audio: string | NovelyAsset) => ValidAction;

	playSound: (audio: string | NovelyAsset, loop?: boolean) => ValidAction;
	pauseSound: (audio: string | NovelyAsset) => ValidAction;
	stopSound: (audio: string | NovelyAsset) => ValidAction;

	/**
	 * Plays voice
	 *
	 * @example
	 * ```
	 * engine.script({
	 *   start: [
	 *     engine.action.voice('./rick-astley-never-gonna-give-you-up.mp3'),
	 *     engine.action.say('Rick', 'Never gonna give you up'),
	 *   ]
	 * })
	 * ```
	 */
	voice: VoiceAction<Languages>;
	/**
	 * Stops currently playing voice
	 */
	stopVoice: () => ValidAction;

	jump: (scene: string) => ValidAction;

	showCharacter: <C extends keyof Characters>(
		character: C,
		emotion?: keyof Characters[C]['emotions'],
		className?: string,
		style?: string,
	) => ValidAction;

	hideCharacter: (
		character: keyof Characters,
		className?: string,
		style?: string,
		duration?: number,
	) => ValidAction;

	animateCharacter: (character: keyof Characters, classes: string) => ValidAction;

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

type DefaultActionProxy = ActionProxy<Record<string, Character>, Lang, State>;
type GetActionParameters<T extends Capitalize<keyof DefaultActionProxy>> = Parameters<
	DefaultActionProxy[Uncapitalize<T>]
>;

type VirtualActions<$Characters extends Record<string, Character>, $Lang extends Lang, $State extends State> = {
	choice: (
		question: TextContent<$Lang, $State>,
		...choices: ActionChoiceChoiceObject<$Lang, $State>[]
	) => ValidAction;
	say: (character: keyof $Characters, content: TextContent<$Lang, $State>) => ValidAction;
};

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
	ActionInputSetupCleanup,
	ActionChoiceChoiceObject,
	ActionChoiceChoice,
	CustomHandlerFunctionGetFn,
	CustomHandlerFunction,
	CustomHandlerFunctionParameters,
	CustomHandlerInfo,
	ConditionCheckFunction,
	ChoiceCheckFunction,
	ChoiceCheckFunctionProps,
	ChoiceOnSelectFunctionProps,
	ChoiceOnSelectFunction,
	FunctionActionProps,
	FunctionAction,
	VirtualActions,
};
