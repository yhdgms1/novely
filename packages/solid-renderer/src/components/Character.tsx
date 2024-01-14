import type { CharacterHandle } from '@novely/core';
import type { AtContextState } from '../types';
import type { VoidComponent } from 'solid-js';

import { setAttribute, effect } from 'solid-js/web';

interface CharacterProps {
	character: string;
	characters: Record<string, CharacterHandle>;
	data: AtContextState['characters'][keyof AtContextState['characters']];
}

const Character: VoidComponent<CharacterProps> = (props) => {
	const canvas = () => props.characters[props.character].canvas;

	effect(() => setAttribute(canvas(), 'style', props.data.style));

	return <>{canvas()}</>;
};

export { Character };
