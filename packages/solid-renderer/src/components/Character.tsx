import type { CharacterHandle } from '@novely/core';
import type { ContextStateCharacter } from '@novely/renderer-toolkit';
import type { VoidComponent } from 'solid-js';

import { setAttribute, effect } from 'solid-js/web';

interface CharacterProps {
	character: string;
	characters: Record<string, CharacterHandle>;
	data: ContextStateCharacter
}

const Character: VoidComponent<CharacterProps> = (props) => {
	const canvas = () => props.characters[props.character].canvas;

	effect(() => setAttribute(canvas(), 'style', props.data.style || ''));

	return <>{canvas()}</>;
};

export { Character };
