import type {
	ActionInputOnInputMeta,
	ActionInputSetup,
	CustomHandler,
	DefaultActionProxy,
	ValidAction,
} from './action';
import type { Character } from './character';
import type { Derived, Stored } from './store';
import type { BaseTranslationStrings } from './translations';
import type {
	CharacterAssetSizes,
	CharactersData,
	CoreData,
	Data,
	Lang,
	NovelyScreen,
	Save,
	State,
	StateFunction,
	StorageData,
	DialogOverview,
} from './types';

type CharacterHandle = {
	emotion: (emotion: string, render: boolean) => void;
	append: (className?: string, style?: string, restoring?: boolean) => void;
	remove: (className?: string, style?: string, duration?: number, restoring?: boolean) => Promise<void>;

	animate: (classes: string[]) => void;

	emotions: Record<string, HTMLImageElement[]>;
};

type CustomActionHandle = {
	/**
	 * Function to remove custom action from screen (and from your state if any completely)
	 */
	remove: () => void;
	/**
	 * Function that will give action root (element which you should add to the screen because custom actions rendered into that element)
	 */
	setMountElement: (mountElement: null | HTMLDivElement) => void;
};

type AudioHandle = {
	stop: () => void;
	pause: () => void;
	play: (loop: boolean) => void;
};

type Context = {
	id: string;

	get root(): HTMLElement;
	set root(value: HTMLElement);

	character: (character: string) => CharacterHandle;
	background: (background: Record<string, string>) => void;
	dialog: (
		content: string,
		name: string,
		character: string | undefined,
		emotion: string | undefined,
		resolve: () => void,
	) => void;
	choices: (
		question: string,
		choices: [
			name: string,
			active: Stored<boolean>,
			visible: Stored<boolean>,
			onselect: () => void,
			image: string,
		][],
		resolve: (selected: number) => void,
	) => void;
	input: (
		question: string,
		onInput: (meta: ActionInputOnInputMeta<Lang, State>) => void,
		setup: ActionInputSetup,
		resolve: () => void,
	) => void;
	clear: (
		keep: Set<keyof DefaultActionProxy>,
		keepCharacters: Set<string>,
		keepAudio: {
			music: Set<string>;
			sounds: Set<string>;
		},
		resolve: () => void,
	) => void;
	custom: (fn: CustomHandler<Lang, State>) => CustomActionHandle;
	/**
	 * Clears all mentioned actions except for preserved one
	 * @param preserve Action that should not be cleared
	 */
	clearBlockingActions: (preserve: 'dialog' | 'choice' | 'input' | 'text' | undefined) => void;

	text: (str: string, resolve: () => void) => void;
	vibrate: (pattern: VibratePattern) => void;

	audio: {
		voice: (source: string, paused: Derived<boolean>) => void;
		voiceStop: () => void;
		music: (source: string, paused: Derived<boolean>, method: 'music' | 'sound') => AudioHandle;
		/**
		 * Stop all sounds
		 */
		clear: () => void;
		/**
		 * Destroy
		 */
		destroy: () => void;
		/**
		 * Initialize audio service, attach events, etc
		 */
		start: () => void;
	};

	loading: (shown: boolean) => void;

	meta: {
		get restoring(): boolean;
		set restoring(value: boolean);

		get preview(): boolean;
		set preview(value: boolean);

		get goingBack(): boolean;
		set goingBack(value: boolean);
	};
};

type Renderer = {
	misc: {
		/**
		 * Function to preload image sync
		 * @param image Image URL
		 * @returns Image URL
		 */
		preloadImage: <T extends string>(image: T) => T;
		/**
		 * Function to preload image async
		 * @param image Image URL
		 * @returns Promise
		 */
		preloadImageBlocking: (image: string) => Promise<void>;

		/**
		 * Function to preload audio
		 * @param source <url> pointing to the audio
		 */
		preloadAudioBlocking: (source: string) => Promise<void>;
	};

	ui: {
		/**
		 * Shows the screen
		 */
		showScreen(name: NovelyScreen): void;
		/**
		 * Returns current screen
		 */
		getScreen(): NovelyScreen | (string & Record<never, never>);
		/**
		 * Shows loading
		 *
		 * Unline `showScreen('loading')` does not change screen
		 */
		showLoading(): void;
		/**
		 * Hides loading
		 */
		hideLoading(): void;
		/**
		 * Shows prompt to exit
		 */
		showExitPrompt(): void;
		/**
		 * Render the game
		 */
		start(): {
			/**
			 * Unmount
			 */
			unmount(): void;
		};
	};

	actions: Record<string, (...args: any[]) => ValidAction>;

	getContext: (context: string) => Context;

	removeContext: (context: string) => void;
};

type RendererInitPreviewReturn = {
	/**
	 * Assets that was used in game preview
	 */
	assets: string[];
};

type RendererInit<$Language extends Lang, $Characters extends Record<string, Character<$Language>>> = {
	characters: CharactersData<$Characters>;
	characterAssetSizes: CharacterAssetSizes<$Characters>;

	set: (save: Save<State>) => Promise<void>;
	restore: (save?: Save<State>) => Promise<void>;

	save: (type: Save<State>[2][1]) => void;
	newGame: () => void;
	exit: (force?: boolean) => void;
	back: () => Promise<void>;

	languages: $Language[];

	/**
	 * Translation function
	 */
	t: (key: BaseTranslationStrings, lang: Lang) => string;
	/**
	 * Store that tracks data updates
	 */
	storageData: Stored<StorageData<Lang, Data>>;
	/**
	 * Store that used to communicate between renderer and core
	 */
	coreData: Stored<CoreData>;
	/**
	 * There is different context, and the main one which is used for game
	 */
	mainContextKey: string;

	preview: (save: Save<State>, name: string) => Promise<RendererInitPreviewReturn>;

	removeContext: (name: string) => void;

	getStateFunction: (context: string) => StateFunction<State>;

	clearCustomActionsAtContext: (ctx: Context) => void;

	getLanguageDisplayName: (lang: Lang) => string;
	getCharacterColor: (character: string) => string;
	getCharacterAssets: (character: string, emotion: string) => string[];
	getDialogOverview: () => Promise<DialogOverview>;

	getResourseType: (url: string) => Promise<'image' | 'audio' | 'other'>;

	setLanguage: (language: string) => void;
};

export type {
	CharacterHandle,
	AudioHandle,
	Renderer,
	RendererInit,
	Context,
	CustomActionHandle,
	RendererInitPreviewReturn,
};
