import type { ValidAction, CustomHandler } from '../action';
import type { NovelyAsset } from '../types';
import { AUDIO_ACTIONS, BLOCK_EXIT_STATEMENTS, BLOCK_STATEMENTS, SKIPPED_DURING_RESTORE } from '../constants';

const isNumber = (val: unknown): val is number => {
	return typeof val === 'number';
};

const isNull = (val: unknown): val is null => {
	return val === null;
};

const isString = (val: unknown): val is string => {
	return typeof val === 'string';
};

const isFunction = (val: unknown): val is (...parameters: any[]) => any => {
	return typeof val === 'function';
};

const isPromise = (val: unknown): val is Promise<any> => {
	return Boolean(val) && (typeof val === 'object' || isFunction(val)) && isFunction((val as any).then);
};

const isEmpty = (val: unknown): val is Record<PropertyKey, never> => {
	return typeof val === 'object' && !isNull(val) && Object.keys(val).length === 0;
};

/**
 * Checks if a given string starts with 'http', '/', '.', or 'data'
 */
const isCSSImageURL = (url: string): boolean => {
	const startsWith = String.prototype.startsWith.bind(url);

	return startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data');
};

/**
 * Determines if a given action requires user interaction based on its type and metadata.
 */
const isUserRequiredAction = ([action, ...meta]: ValidAction) => {
	return Boolean(action === 'custom' && meta[0] && (meta[0] as unknown as CustomHandler).requireUserAction);
};

const isBlockStatement = (statement: unknown): statement is 'choice' | 'condition' | 'block' => {
	return BLOCK_STATEMENTS.has(statement as any);
};

const isBlockExitStatement = (
	statement: unknown,
): statement is 'choice:exit' | 'condition:exit' | 'block:exit' => {
	return BLOCK_EXIT_STATEMENTS.has(statement as any);
};

const isSkippedDuringRestore = (item: unknown): item is 'vibrate' | 'dialog' | 'input' | 'choice' | 'text' => {
	return SKIPPED_DURING_RESTORE.has(item as any);
};

type AudioActionName = 'playMusic' | 'stopMusic' | 'playSound' | 'stopSound' | 'voice' | 'stopVoice';

const isAudioAction = (action: unknown): action is AudioActionName => {
	return AUDIO_ACTIONS.has(action as any);
};

const isAction = (element: unknown): element is Exclude<ValidAction, ValidAction[]> => {
	return Array.isArray(element) && isString(element[0]);
};

const isImageAsset = (asset: unknown): asset is string => {
	return isString(asset) && isCSSImageURL(asset);
};

/**
 * Is custom and requires user action or skipped during restoring
 */
const isBlockingAction = (action: Exclude<ValidAction, ValidAction[]>) => {
	return isUserRequiredAction(action) || (isSkippedDuringRestore(action[0]) && action[0] !== 'vibrate');
};

const isAsset = (suspect: unknown): suspect is NovelyAsset => {
	return suspect !== null && typeof suspect === 'object' && 'source' in suspect && 'type' in suspect;
};

export {
	isNumber,
	isNull,
	isString,
	isFunction,
	isPromise,
	isEmpty,
	isCSSImageURL,
	isUserRequiredAction,
	isBlockStatement,
	isBlockExitStatement,
	isSkippedDuringRestore,
	isAudioAction,
	isAction,
	isImageAsset,
	isBlockingAction,
	isAsset,
};

export type { AudioActionName };
