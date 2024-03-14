import type { ActionInputSetup, ActionInputOnInputMeta, BackgroundImage, DefaultActionProxy, ValidAction } from './action';
import type { Character } from './character';
import type { CoreData, NovelyScreen, Save, State, StateFunction, StorageData, Thenable } from './types';
import type { BaseTranslationStrings } from './translations';
import type { Stored } from './store';

interface CharacterHandle {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	emotion: (emotion: string, render: boolean) => void;
	append: (className?: string, style?: string, restoring?: boolean) => void;
	remove: (
		className?: string,
		style?: string,
		duration?: number,
		restoring?: boolean
	) => Promise<void>;

	animate: (timeout: number, classes: string[]) => void;

	emotions: Record<string, HTMLImageElement[]>;
}

type AudioHandle = {
	stop: () => void;
	pause: () => void;
	play: () => void;
}

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
		showScreen(name: NovelyScreen | 'loading'): void;
		/**
		 * Returns current screen
		 */
		getScreen(): NovelyScreen | 'loading' | (string & Record<never, never>);
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

	getContext: (context: string) => {
		id: string;

		get root(): HTMLElement;
		set root(value: HTMLElement);

		character: (character: string) => CharacterHandle;
		background: (background: string | BackgroundImage) => void;
		dialog: (
			content: string,
			name: string,
			character: string | undefined,
			emotion: string | undefined,
			resolve: () => void
		) => void;
		choices: (
			question: string,
			choices: [name: string, actions: ValidAction[], active?: boolean][],
			resolve: (selected: number) => void
		) => void;
		input: (
			question: string,
			onInput: (meta: ActionInputOnInputMeta<string, State>) => void,
			setup: ActionInputSetup,
			resolve: () => void
		) => void;
		clear: (
			keep: Set<keyof DefaultActionProxy>,
			keepCharacters: Set<string>,
			keepAudio: {
				music: Set<string>,
				sounds: Set<string>
			},
			resolve: () => void
		) => void;
		custom: (
			fn: Parameters<DefaultActionProxy['custom']>[0],
			push: () => void,
		) => Thenable<void>;
		clearCustom: (
			fn: Parameters<DefaultActionProxy['custom']>[0],
		) => void;

		text: (str: string, resolve: () => void) => void;
		vibrate: (pattern: VibratePattern) => void;

		audio: {
			voice: (source: string) => void;
			voiceStop: () => void;
			music: (source: string, method: 'music' | 'sound', loop?: boolean) => AudioHandle;
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

		meta: {
			get restoring(): boolean;
			set restoring(value: boolean);

			get preview(): boolean;
			set preview(value: boolean);

			get goingBack(): boolean;
			set goingBack(value: boolean);
		}

		store: unknown;
		setStore: unknown;
	}

	removeContext: (context: string) => void;
};

type Context = ReturnType<Renderer['getContext']>;

type RendererInit = {
	characters: Record<string, Character>;
	set: (save: Save) => Promise<void>;
	restore: (save?: Save) => Promise<void>;
	save: (override?: boolean, type?: Save[2][1]) => void;
	newGame: () => void;
	exit: (force?: boolean) => void;
	back: () => Promise<void>;
	languages: string[];

	/**
	 * Translation function
	 */
	t: (key: BaseTranslationStrings, lang: string) => string;
	/**
	 * Store that tracks data updates
	 */
	$: Stored<StorageData>;
	/**
	 * Store that used to communicate between renderer and core
	 */
	$$: Stored<CoreData>;
	/**
	 * There is different context, and the main one which is used for game
	 */
	mainContextKey: string;

	preview: (save: Save, name: string) => Promise<void>;

	removeContext: (name: string) => void;

	getStateFunction: (context: string) => StateFunction<State>;
};

export type { CharacterHandle, AudioHandle, Renderer, RendererInit, Context };
