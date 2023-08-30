import type { BackgroundImage, DefaultActionProxyProvider, ValidAction } from './action';
import type { Character } from './character';
import type { CoreData, Save, Stack, StorageData, Thenable } from './types';
import type { BaseTranslationStrings } from '@novely/t9n';
import type { Stored } from './store';

interface CharacterHandle {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	withEmotion: (emotion: string) => () => void;
	append: (className?: string, style?: string, restoring?: boolean) => void;
	remove: (
		className?: string,
		style?: string,
		duration?: number,
	) => (resolve: () => void, restoring: boolean) => void;

	emotions: Record<string, HTMLImageElement | Record<'head' | 'left' | 'right', HTMLImageElement>>;
}

interface AudioHandle {
	element: HTMLAudioElement;

	stop: () => void;
	pause: () => void;
	play: () => void;
}

interface RendererStore {
	characters: Record<string, CharacterHandle>;
	audio: Partial<Record<'music', AudioHandle>>;
}

type Renderer = {
	character: (character: string) => CharacterHandle;
	background: (background: string | BackgroundImage) => void;
	dialog: (content: string, name: string, character?: string, emotion?: string) => (resolve: () => void, goingBack: boolean) => void;
	choices: (
		question: string,
		choices: ([string, ValidAction[]] | [string, ValidAction[], () => boolean])[],
	) => (resolve: (selected: number) => void) => void;
	input: (
		question: string,
		onInput: Parameters<DefaultActionProxyProvider['input']>[1],
		setup?: Parameters<DefaultActionProxyProvider['input']>[2],
	) => (resolve: () => void) => void;
	music: (source: string, method: keyof RendererStore['audio']) => AudioHandle;
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

	misc: {
		preloadImagesBlocking: (images: Set<string>) => Promise<PromiseSettledResult<unknown>[]>;
	};

	store: RendererStore;

	ui: {
		/**
		 * Shows the screen
		 */
		showScreen(name: 'mainmenu' | 'game' | 'saves' | 'settings' | 'loading'): void;
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
};

export type { CharacterHandle, AudioHandle, RendererStore, Renderer, RendererInit };
