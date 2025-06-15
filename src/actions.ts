import type { TypesFromEngine, TextContent, ValidAction } from '@novely/core';
import type { ParticleOptions } from './particles';
import type { CreateMomentPresserOptions } from '@novely/moment-presser';
import { extendAction } from '@novely/core';
import { showParticles } from '@novely/particles';
import { createMomentPresser } from '@novely/moment-presser';
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
	momentPresser: (onPressed: CreateMomentPresserOptions<Types>['onPressed']) => {
		const momentPresser = createMomentPresser<Types>({
			onPressed: onPressed,
			translation: {
				en: {
					stop: 'Stop'
				},
				ru: {
					stop: 'Стоп'
				}
			}
		});

		return ['custom', momentPresser];
	}
});

export { action }
