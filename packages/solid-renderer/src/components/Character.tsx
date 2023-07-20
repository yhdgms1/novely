import type { CharacterHandle } from '@novely/core';
import type { State } from '../renderer';
import type { VoidComponent } from 'solid-js';

import { setAttribute, effect } from 'solid-js/web';

interface CharacterProps {
	character: string;
	characters: Record<string, CharacterHandle>;
	data: State['characters'][keyof State['characters']];
}

const Character: VoidComponent<CharacterProps> = (props) => {
	const canvas = () => props.characters[props.character].canvas;

	effect(() => setAttribute(canvas(), 'style', props.data.style));

	return <>{canvas()}</>;
};

export { Character };
