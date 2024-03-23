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
	CustomHandlerFunctionGetFn,
	CustomHandlerFunctionParameters
} from './action';
export type { Emotions, Character } from './character';
export type { CharacterHandle, AudioHandle, Renderer, RendererInit, Context } from './renderer';
export type { Storage } from './storage';
export type {
	Thenable,
	Path,
	StorageData,
	StorageMeta,
	TypewriterSpeed,
	Lang,
	NovelyScreen,
	CoreData,
	Save,
	NovelyInit,
	StackHolder,
	Stack,
	State,
	StateFunction,
	Data,
	DeepPartial
} from './types';
export type { Stored } from './store';
export type { BaseTranslationStrings } from './translations';
export type { AllowedContent, PluralType, Pluralization, TranslationActions } from './translation';

export { novely } from './novely';
export { localStorageStorage } from './storage';

export { RU, EN, JP, KK } from './translations';
