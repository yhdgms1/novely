import type { TypesFromEngine, TextContent, ValidAction } from '@novely/core';
import type { ParticleOptions } from './particles';
import { extendAction } from '@novely/core';
import { showParticles } from '@novely/particles';
import { engine } from './engine';

type Types = TypesFromEngine<typeof engine>;

type Characters = keyof Types['c'];
type Text = TextContent<Types['l'], Types['s']>;

const talk = (character: Characters, text: Text) => {
	return [
		engine.action.showCharacter(character),
		engine.action.animateCharacter(character, 'character-animation-talk'),
		engine.action.say(character, text),
	] as ValidAction;
}

const action = extendAction(engine.action, {
	talk,
	showParticles: (options: ParticleOptions) => {
		return ['custom', showParticles(options)];
	},
});

export { action }
