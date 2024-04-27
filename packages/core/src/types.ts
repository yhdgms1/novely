import type { DefaultActionProxy, ValidAction } from './action';
import type { Storage } from './storage';
import type { TranslationActions, Pluralization } from './translation';
import type { Renderer, RendererInit } from './renderer';
import type { Character } from './character';
import type { BaseTranslationStrings } from './translations';
import type {	getLanguage as defaultGetLanguage } from './utils';

type Thenable<T> = T | Promise<T>;

type NoInfer<T> = [T][T extends any ? 0 : never];

type PathItem =
	| [null, number | string]
	| ['jump', string]
	| ['choice', number]
	| ['choice:exit']
	| ['condition', string]
	| ['condition:exit']
	| ['exit']
	| ['block', string]
	| ['block:exit'];

type Path = PathItem[];

type State = Record<string, any>;
type Data = Record<string, any>;

type SaveDate = number;
type SaveType = 'manual' | 'auto';

type SaveMeta = [date: SaveDate, type: SaveType];

type Save<S extends State = State> = [
	path: Path,
	state: S,
	meta: SaveMeta
];

type Lang = string;
type TypewriterSpeed = 'Slow' | 'Medium' | 'Fast' | 'Auto';
type SoundVolume = number;

type StorageMeta<L extends Lang = string> = [
	lang: L,
	typewriter_speed: TypewriterSpeed,
	music_volume: SoundVolume,
	sound_volume: SoundVolume,
	voice_volume: SoundVolume
];

type Migration = (save: unknown) => unknown;

type StorageData<L extends Lang = string, D extends Data = Data> = {
	saves: Save[];
	data: D;
	meta: StorageMeta<L>;
};

type Stack = {
	value: Save;
	back(): void;
	push(value: Save): void;
	clear(): void;
};

type NovelyScreen = 'mainmenu' | 'game' | 'saves' | 'settings';

/**
 * @see https://pendletonjones.com/deep-partial
 */
type DeepPartial<T> = unknown extends T
	? T
	: T extends object
	  ? {
				[P in keyof T]?: T[P] extends Array<infer U>
					? Array<DeepPartial<U>>
					: T[P] extends ReadonlyArray<infer U>
					  ? ReadonlyArray<DeepPartial<U>>
					  : DeepPartial<T[P]>;
	    }
	  : T;

type ActionFN = DefaultActionProxy[keyof DefaultActionProxy];

type NonEmptyRecord<T extends Record<PropertyKey, unknown>> = keyof T extends never ? never : T;

type CoreData = {
	dataLoaded: boolean;
};

type UseStackFunctionReturnType = {
	/**
	 * Save that was after current value before `back` was used
	 */
	get previous(): Save | undefined;

	value: Save;
	back(): void;
	push(value: Save): void;
	clear(): void;
};

type StackHolder = Save[] & {
	previous: Save | undefined
}

type TranslationDescription = {
	internal: Record<BaseTranslationStrings, string>;
	/**
	 * IETF BCP 47 language tag
	 */
	tag?: string;
	/**
	 * Custom name
	 */
	nameOverride?: string;
	plural?: Record<string, Pluralization>;
	actions?: TranslationActions;
}

interface NovelyInit<
	$Language extends Lang,
	$Characters extends Record<string, Character<NoInfer<$Language>>>,
	$State extends State,
	$Data extends Data,
	$Actions extends Record<string, (...args: any[]) => ValidAction>
> {
	/**
	 * An object containing the characters in the game.
	 * @example
	 * ```ts
	 * const engine = novely({
	 *  characters: {
	 *   // Character ID
	 *   Alexei: {
	 *    name: 'Alexei',
	 *    color: '#f60002',
	 *    emotions: {
	 *     hopeful: './hopeful.png'
	 *    }
	 *   }
	 *  }
	 * })
	 * ```
	 */
	characters: $Characters;
	/**
	 * Define default emotions for characters
	 * @example
	 * ```ts
	 * const engine = novely({
	 *  characters: {
	 *   Yuki: {
	 *    name: 'Yuki',
	 *    color: '#f595f6',
	 *    emotions: {
	 *     normal: './normal.png'
	 *    }
	 *   }
	 *  },
	 *  defaultEmotions: {
	 *   Yuki: 'normal'
	 *  }
	 * });
	 *
	 * engine.script({
	 *  start: [
	 *    // Without emotion!
	 *    engine.action.showCharacter('Yuki')
	 *  ]
	 * })
	 * ```
	 */
	defaultEmotions?: {
		[Character in keyof NoInfer<$Characters>]?: (keyof NoInfer<$Characters>[Character]['emotions'] & string)
	}
	/**
	 * An object that provides access to the game's storage system.
	 * @default localStorage // at key `novely-game-storage`
	 */
	storage?: Storage;
	/**
	 * Delay loading data until Promise is resolved
	 */
	storageDelay?: Promise<void>;
	/**
	 * A function that returns a Renderer object used to display the game's content
	 */
	renderer: (
		initializationData: RendererInit<NoInfer<$Language>, NoInfer<$Characters>>
	) => Renderer & { actions: $Actions };
	/**
	 * An optional property that specifies the initial screen to display when the game starts
	 */
	initialScreen?: NovelyScreen;
	/**
	 * An object containing the translation functions used in the game
	 * @see https://novely.pages.dev/guide/translation.html Docs
	 * @example
	 * ```ts
	 * import { novely, EN } from 'novely';
	 *
	 * const engine = novely({
	 *  translation: {
	 *   internal: EN,
	 *   // Optional IETF BCP 47 language tag
	 *   tag: 'en-US',
	 *   plural: {
	 *
	 *   },
	 *   actions: {
	 *
	 *   }
	 *  }
	 * })
	 * ```
	 */
	translation: Record<
		$Language,
		TranslationDescription
	>;
	/**
	 * Initial state value
	 *
	 * State is a local value bound to one save
	 */
	state?: $State;
	/**
	 * Initial data value
	 *
	 * Data is a global value shared between saves
	 */
	data?: $Data;
	/**
	 * Enable autosaves or disable
	 * @default true
	 */
	autosaves?: boolean;
	/**
	 * Migration from old saves to newer
	 */
	migrations?: Migration[];
	/**
	 * For saves Novely uses `throttle` function. This might be needed if you want to control frequency of saves to the storage
	 * @default 799
	 */
	throttleTimeout?: number;
	/**
	 * Limits how many assets can be downloaded parallelly
	 * @default 15
	 */
	parallelAssetsDownloadLimit?: number;
	/**
	 * Custom language detector
	 * @param languages Supported languages
	 * @param original Original function that novely, could be used as fallback
	 * @example
	 * ```ts
	 * const engine = novely({
	 * 	getLanguage(languages, original) {
	 * 		if (!sdk) return original(languages);
	 *
	 * 		return sdk.environment.i18n.lang // i.e. custom language from some sdk
	 * 	}
	 * })
	 * ```
	 */
	getLanguage?: (languages: NoInfer<$Language>[], original: typeof defaultGetLanguage) => $Language | (string & Record<never, never>);
	/**
	 * Ignores saved language, and uses `getLanguage` to get it on every engine start
	 * @default false
	 */
	overrideLanguage?: boolean;
	/**
	 * Show a prompt before exiting a game
	 * @default true
	 */
	askBeforeExit?: boolean;
	/**
	 * @default "lazy"
	 */
	preloadAssets?: 'lazy' | 'blocking';
	/**
	 * Fetching function
	 */
	fetch?: typeof fetch
	/**
	 * When page is going to be unloaded will call `storage.set` method
	 * If 'prod' is passed enable only in production env.
	 * @default true
	 */
	saveOnUnload?: boolean | 'prod';
	/**
	 * The key that signifies the start of the game. It is not recommended to override this parameter.
	 *
	 * @default 'start'
	 * @example
	 * ```ts
	 * const engine = novely({
	 *   ...,
	 *   startKey: 'PART_1'
	 * })
	 *
	 * engine.script({
	 *   // now game will start from here
	 *   PART_1: [
	 *
	 *   ]
	 * })
	 * ```
	 */
	startKey?: 'start' | (string & Record<never, never>);
}

type StateFunction<S extends State> = {
	(value: DeepPartial<S> | ((prev: S) => S)): void;
	(): S;
}

export type {
	Thenable,
	PathItem,
	Path,
	Save,
	State,
	Stack,
	StorageData,
	StorageMeta,
	TypewriterSpeed,
	Lang,
	DeepPartial,
	NovelyScreen,
	Migration,
	Data,
	ActionFN,
	NonEmptyRecord,
	CoreData,
	UseStackFunctionReturnType,
	StackHolder,
	NovelyInit,
	StateFunction
};
