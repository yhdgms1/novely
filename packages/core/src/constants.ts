import type { TypewriterSpeed } from './types';

const SKIPPED_DURING_RESTORE = new Set(['dialog', 'choice', 'input', 'vibrate', 'text'] as const);

const BLOCK_EXIT_STATEMENTS = new Set(['choice:exit', 'condition:exit', 'block:exit'] as const);

const BLOCK_STATEMENTS = new Set(['choice', 'condition', 'block'] as const);

const AUDIO_ACTIONS = new Set(['playMusic', 'stopMusic', 'playSound', 'stopSound', 'voice', 'stopVoice'] as const);

const EMPTY_SET = new Set<any>();

const DEFAULT_TYPEWRITER_SPEED: TypewriterSpeed = 'Medium';

const HOWLER_SUPPORTED_FILE_FORMATS = new Set([
	'mp3',
	'mpeg',
	'opus',
	'ogg',
	'oga',
	'wav',
	'aac',
	'caf',
	'm4a',
	'm4b',
	'mp4',
	'weba',
	'webm',
	'dolby',
	'flac',
] as const);

const SUPPORTED_IMAGE_FILE_FORMATS = new Set([
	'apng',
	'avif',
	'gif',
	'jpg',
	'jpeg',
	'jfif',
	'pjpeg',
	'pjp',
	'png',
	'svg',
	'webp',
	'bmp',
] as const);

/**
 * @internal
 */
const MAIN_CONTEXT_KEY = '$MAIN';

export {
	SKIPPED_DURING_RESTORE,
	EMPTY_SET,
	DEFAULT_TYPEWRITER_SPEED,
	BLOCK_EXIT_STATEMENTS,
	BLOCK_STATEMENTS,
	MAIN_CONTEXT_KEY,
	AUDIO_ACTIONS,
	HOWLER_SUPPORTED_FILE_FORMATS,
	SUPPORTED_IMAGE_FILE_FORMATS,
};
