import type { Character } from '../character';
import type { CharactersData, Lang } from '../types';

const getCharactersData = <Characters extends Record<string, Character<Lang>>>(characters: Characters) => {
	const entries = Object.entries(characters);
	const mapped = entries.map(([key, value]) => [key, { name: value.name, emotions: Object.keys(value.emotions) }]);

	return Object.fromEntries(mapped) as CharactersData<Characters>;
};

export { getCharactersData };
