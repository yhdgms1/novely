/**
 * This code is adapted from the Howler.js source code.
 * Howler.js: https://github.com/goldfire/howler.js
 */

/**
 * I guess some browsers will return "no". So it's better to be safe
 */
const cut = (str: CanPlayTypeResult | 'no') => str.replace(/^no$/, '');

const audio = new Audio();

const canPlay = (type: string) => !!cut(audio.canPlayType(type));
const canPlayMultiple = (...types: string[]) => types.some((type) => canPlay(type));

const supportsMap = {
	mp3: canPlayMultiple('audio/mpeg;', 'audio/mp3;'),
	mpeg: canPlay('audio/mpeg;'),
	opus: canPlay('audio/ogg; codecs="opus"'),
	ogg: canPlay('audio/ogg; codecs="vorbis"'),
	oga: canPlay('audio/ogg; codecs="vorbis"'),
	wav: canPlayMultiple('audio/wav; codecs="1"', 'audio/wav;'),
	aac: canPlay('audio/aac;'),
	caf: canPlay('audio/x-caf;'),
	m4a: canPlayMultiple('audio/x-m4a;', 'audio/m4a;', 'audio/aac;'),
	m4b: canPlayMultiple('audio/x-m4b;', 'audio/m4b;', 'audio/aac;'),
	mp4: canPlayMultiple('audio/x-mp4;', 'audio/mp4;', 'audio/aac;'),
	weba: canPlay('audio/webm; codecs="vorbis"'),
	webm: canPlay('audio/webm; codecs="vorbis"'),
	dolby: canPlay('audio/mp4; codecs="ec-3"'),
	flac: canPlayMultiple('audio/x-flac;', 'audio/flac;'),
};

export { supportsMap };
