import { engine } from './engine'

import outdoor from './assets/outdoor.png'

const { script, action: a } = engine

script({
	start: [
		a.showBackground('#000000'),
		a.text(
			'You open your eyes in a beautiful place and see a girl next to you.',
		),
		a.showBackground(outdoor),
		a.showCharacter('Lily', 'normal'),
		a.dialog('You', 'Uh, hi'),
		a.dialog('Lily', 'Hey, who are you? You fell out of the sky!'),
		a.dialog('You', 'I... I dont know...'),
		a.dialog('Lily', 'My name is Lily. And you are...?'),
		a.input(
			'What is your name?',
			({ input, error, state, value }) => {
				/**
				 * Set the error, or remove it when string is empty
				 */
				error(input.validationMessage)

				if (!input.validationMessage) {
					state({ name: value })
				}
			},
			input => {
				input.setAttribute('type', 'string')
				input.setAttribute('min', '2')
				input.setAttribute('max', '46')
			},
		),
		a.dialog('Lily', 'Well, {{name}}, there our novel starts!'),
		a.end(),
	],
})
