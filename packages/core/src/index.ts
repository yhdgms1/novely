export type {
	ValidAction,
	Story,
	ActionProxyProvider,
	DefaultActionProxyProvider,
	GetActionParameters,
	Unwrappable,
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
	Save
} from './types';
export type { Stored } from './store';
export type { BaseTranslationStrings } from './translations';
export type { AllowedContent, PluralType, Pluralization, TranslationActions } from './translation';

export { novely } from './novely';
export { localStorageStorage } from './storage';

export { RU, EN, JP, KK } from './translations';

import {
	findLast,
	findLastIndex,
	throttle,
	getLanguage,
	isCSSImage,
	isFunction,
	isPromise
} from './utils'

/**
 * Certain set of utils used in `@novely/core`
 *
 * This is better then making submodule `@novely/core/utils` because it is clearer how bundle is made in browser (iife) version
 */
const utils = {
	findLast,
	findLastIndex,
	throttle,
	getLanguage,
	isCSSImage,
	isFunction,
	isPromise
}

export { utils }
