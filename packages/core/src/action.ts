import type { Character } from './character';
import type { Context } from './renderer';
import type { Derived } from './store';
import type { Ticker } from './ticker';
import type { Lang, NonEmptyRecord, NovelyAsset, Path, Save, State, StateFunction, Thenable } from './types';

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
	| ['preload', string | NovelyAsset]
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

type OnForwardFnParams = {
	isUserRequiredAction: boolean;
	isBlockingAction: boolean;

	action: Exclude<ValidAction, ValidAction[]>;
};

type OnForwardFn = (params: OnForwardFnParams) => void;

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
	 * Function to get current Save. It can be mutated. Only use it when you know what you do
	 *
	 * @deprecated
	 */
	getSave: () => Save<S>;

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
	 *
	 * @example
	 * ```ts
	 * type Data = { name: string };
	 *
	 * const handler: CustomHandler = async ({ data }) => {
	 *   const _data = data<Data>();
	 *
	 *   if (!_data.name) {
	 *     _data.name = 'Mr. Crabs'
	 *   }
	 *
	 *   data<Data>().name // 'Mr. Crabs'
	 *
	 *   data<Data>() == _data // true
	 *
	 *   // passing object will replace object
	 *   data<Data>({ name: 'Mr. Crabs' })
	 *   data<Data>() == _data // false
	 * }
	 * ```
	 */
	data: CustomHandlerGetResultDataFunction;

	/**
	 * Function to access data stored at specific key.
	 * @example
	 * ```ts
	 * const handler: CustomHandler = async ({ dataAtKey }) => {
	 *   // peek at data at action with key 'action-2'
	 *   console.log(dataAtKey('action-2'))
	 * }
	 *
	 * handler.key = 'action-1'
	 * ```
	 * @deprecated
	 */
	dataAtKey: <T extends Record<string, unknown>>(key: string) => T | null;

	/**
	 * Function to register cleanup callbacks (executed in reverse order of registration).
	 *
	 * @example
	 * ```ts
	 * const handler: CustomHandler = async ({ clear, paused }) => {
	 *   const unsubscribe = paused.subscribe((paused) => {
	 *
	 *   })
	 *
	 *   clear(paused);
	 * }
	 * ```
	 */
	clear: (fn: () => void) => void;

	/**
	 * Overwrites `onBack` callback. Callback will be called after clearing some actions, but before starting others.
	 *
	 * @example
	 * ```ts
	 * const handler: CustomHandler = ({ getDomNodes, state, onBack }) => {
	 *   // some code
	 *   const update = () => button.textContent = `Clicks: ${state().clicks}`;
	 *
	 *   onBack(() => {
	 *     console.log('Backing up');
	 *     // sync state with UI
	 *     update();
	 *   })
	 * }
	 * ```
	 */
	onBack: (fn: () => void) => void;

	/**
	 * Overwrites `onForward` callback. Callback will be called before executing next action.
	 *
	 * @example
	 * ```ts
	 * const handler: CustomHandler = ({ getDomNodes, state, onForward }) => {
	 *   onForward(({ action, isBlockingAction, isUserRequiredAction }) => {
	 *     console.log(action)
	 *     console.log({ isBlockingAction, isUserRequiredAction })
	 *   })
	 * }
	 * ```
	 */
	onForward: (fn: OnForwardFn) => void;

	/**
	 * It will call all clear actions and remove HTML element from `getDomNodes` function
	 */
	remove: () => void;

	/**
	 * State function
	 */
	state: StateFunction<S>;

	/**
	 * Game state
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

	/**
	 * Function to replace template content
	 *
	 * @example
	 * ```ts
	 * const handler: CustomHandler = async ({ state, templateReplace }) => {
	 *   const text = templateReplace({ en: '' }, state())
	 * }
	 * ```
	 */
	templateReplace: (content: TextContent<L, State>, values?: State) => string;

	/**
	 * Is game currently paused
	 *
	 * @example
	 * ```ts
	 * const handler: CustomHandler = async ({ clear, paused }) => {
	 *   const unsubscribe = paused.subscribe((paused) => {
	 *     // Here you can pause/resume animations, sounds, etc, etc
	 *   })
	 *
	 *   clear(paused);
	 * }
	 */
	paused: Derived<boolean>;

	/**
	 * Ticker
	 *
	 * @example
	 * ```ts
	 * const handler: CustomHandler = async ({ clear, ticker }) => {
	 *   const unsubscribe = ticker.add((ticker) => {
	 *     console.log(ticker.deltaTime);
	 *   })
	 *
	 *   ticker.start();
	 *
	 *   clear(unsubscribe);
	 * }
	 * ```
	 */
	ticker: Ticker;

	/**
	 * Fetching function.
	 * @default fetch
	 */
	request: typeof fetch;
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
	 * @param nextActions Next actions in the restoring queue
	 */
	skipOnRestore?: (nextActions: Exclude<ValidAction, ValidAction[]>[]) => boolean;
};

/**
 * Array of URL or NovelyAsset
 */
type ResolvedAssets = (NovelyAsset | string)[];

type AssetsResolverArgs = {
	/**
	 * Fetching function
	 */
	request: typeof fetch;
};

/**
 * Function to get assets
 */
type AssetsResolver = (args: AssetsResolverArgs) => Thenable<ResolvedAssets>;

type CustomHandlerInfo = CustomHandlerCalling & {
	/**
	 * Assets used by action. When preload is "automatic", will be preloaded before action runs.
	 *
	 * In case function is provided, execution time is limited to 250ms,
	 * then returned assets or empty array (when limited)
	 * will always be used with that action
	 *
	 * @example
	 * ```ts
	 * handler.assets = [url]
	 * handler.assets = async ({ request }) => {
	 *   return [url]
	 * }
	 * ```
	 */
	assets?: ResolvedAssets | AssetsResolver;
	/**
	 * When true interacting with it will be saved in history
	 */
	requireUserAction?: boolean;
	/**
	 * Id by which we will determine what action is which
	 */
	id: string | symbol;

	/**
	 * Key by which we will save the custom action's data. It includes cleanup function's provided by `clear` and data in `data` function
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

	preload: (source: string | NovelyAsset) => ValidAction;

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
	ResolvedAssets,
	OnForwardFn,
	OnForwardFnParams,
};
