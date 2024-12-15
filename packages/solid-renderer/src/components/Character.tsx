import type { VoidComponent } from 'solid-js';
import type { CustomCharacterHandle } from '../types';

type CharacterProps = {
	character: string;
	characters: Record<string, CustomCharacterHandle>;
};

const Character: VoidComponent<CharacterProps> = (props) => {
	return props.characters[props.character].canvas;
};

export { Character };
