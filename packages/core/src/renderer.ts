import type { BackgroundImage, DefaultActionProxyProvider, ValidAction } from './action';
import type { Character } from './character';
import type { CoreData, NovelyScreen, Save, Stack, StorageData, Thenable } from './types';
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

	emotions: Record<string, HTMLImageElement[]>;
}

type AudioHandle = {
	stop: () => void;
	pause: () => void;
	play: () => void;
}

interface RendererStore {
	characters: Record<string, CharacterHandle>;
}

type Renderer = {
	misc: {
		/**
		 * Function to preload images async and await for all images to load or fail
		 * @param images Set of images to load
		 */
		preloadImagesBlocking: (images: Set<string>) => Promise<PromiseSettledResult<unknown>[]>;
		/**
		 * Function to preload image sync
		 * @param image Image URL
		 * @returns Image URL
		 */
		preloadImage: <T extends string>(image: T) => T;

		/**
		 * Function to preload audio
		 * @param type kind of audio
		 * @param source <url> pointing to the audio
		 */
		preloadAudioBlocking: (type: 'music', source: string) => Promise<void>;
	};

	store: RendererStore;

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
		character: (character: string) => CharacterHandle;
		background: (background: string | BackgroundImage) => void;
		dialog: (
			content: string,
			name: string,
			character?: string,
			emotion?: string,
		) => (resolve: () => void, goingBack: boolean) => void;
		choices: (
			question: string,
			choices: ([string, ValidAction[]] | [string, ValidAction[], () => boolean])[],
		) => (resolve: (selected: number) => void) => void;
		input: (
			question: string,
			onInput: Parameters<DefaultActionProxyProvider['input']>[1],
			setup?: Parameters<DefaultActionProxyProvider['input']>[2],
		) => (resolve: () => void) => void;
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
			 * Start
			 * @todo: more descriptive
			 */
			start: () => void;
		};
		clear: (
			goingBack: boolean,
			keep: Set<keyof DefaultActionProxyProvider>,
			keepCharacters: Set<string>,
		) => (resolve: () => void) => void;
		custom: (
			fn: Parameters<DefaultActionProxyProvider['custom']>[0],
			goingBack: boolean,
			push: () => void,
		) => Thenable<void>;
		text: (str: string, resolve: () => void, goingBack: boolean) => void;
		vibrate: (pattern: VibratePattern) => void;
	}
};

type RendererInit = {
	characters: Record<string, Character>;
	set: (save: Save) => Promise<void>;
	restore: (save?: Save) => Promise<void>;
	save: (override?: boolean, type?: Save[2][1]) => void;
	newGame: () => void;
	exit: (force?: boolean) => void;
	back: () => Promise<void>;
	stack: Stack;
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
};

export type { CharacterHandle, AudioHandle, RendererStore, Renderer, RendererInit };
