import type { CharacterHandle, NovelyScreen } from '@novely/core';
import type { JSX } from 'solid-js';
import type { MountableElement } from 'solid-js/web';

type StateScreen = () => {
	mount(): Element | JSX.Element;
	unmount?(): void;
};

type StateScreens = Record<string, StateScreen>;

type PossibleScreen = NovelyScreen | (string & Record<never, never>);

type StateMainmenuItem = (goto: (name: PossibleScreen) => void) => JSX.ButtonHTMLAttributes<HTMLButtonElement>;
type StateMainmenuItems = StateMainmenuItem[];

type CustomCharacterHandle = CharacterHandle & {
	/**
	 * Node in which character is rendered
	 */
	element: HTMLDivElement;
};

type SolidRendererStore = {
	characters: Record<string, CustomCharacterHandle>;
};

type CreateSolidRendererOptions = {
	/**
	 * Enter fullscreen mode when opening a game, exit when opening main-menu
	 * @default false
	 */
	fullscreen?: boolean;
	/**
	 * Controls position
	 * @default "outside"
	 */
	controls?: 'inside' | 'outside';
	/**
	 * Where Novely will be mounted
	 * @default document.body
	 */
	target?: MountableElement;
	/**
	 * Show audio settings in settings menu?
	 * @default true
	 */
	showAudioSettings?: boolean;
};

type EmitterEventsMap = {
	'screen:change': PossibleScreen;
};

type RendererStoreExtension = { screens: Record<string, StateScreen>; mainmenu: StateMainmenuItems };

export type {
	EmitterEventsMap,
	StateScreen,
	StateScreens,
	PossibleScreen,
	StateMainmenuItem,
	StateMainmenuItems,
	SolidRendererStore,
	CreateSolidRendererOptions,
	RendererStoreExtension,
	CustomCharacterHandle,
};
