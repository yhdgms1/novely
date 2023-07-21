import { render } from 'solid-js/web';
import { novely, localStorageStorage } from '@novely/core';
import { createT9N, RU, EN } from '@novely/t9n';
import { createSolidRenderer } from '@novely/solid-renderer';

import { particles, hide } from '@novely/particles';
import { snow } from './particles';

import outdoor from './assets/outdoor.png';
import lily_ok from './assets/lily.png';

const { createRenderer, Novely, registerScreen, registerMainmenuItem } = createSolidRenderer({
	fullscreen: false,
});

const engine = novely({
	languages: ['ru', 'en'],
	storage: localStorageStorage({ key: 'novely-saves' }),
	renderer: createRenderer,
	characters: {
		Lily: {
			name: {
				ru: 'Лилия',
				en: 'Lily',
			},
			color: '#ed5c87',
			emotions: {
				ok: lily_ok,
			},
		},
	},
	t9n: createT9N({
		ru: {
			internal: RU,
			pluralization: {
				years: {
					zero: 'лет',
					one: 'год',
					few: 'года',
					many: 'лет',
				},
			},
			strings: {
				StartText: 'На улице прекрасный день, ты открываешь глаза и встречаешь...',
				HowOldAreYou: 'Сколько тебе лет?',
				EnterYourName: 'Введи имя',
				EnterYourAge: 'Введи возраст',
				AreYouLost: 'Тебе {{age}} {{age@years}}? Малышь, ты потерялся?',
				ChoiceAreYouLost: 'Ты потерялся?',
				YesHelpMe: 'Да, помоги мне',
			},
		},
		en: {
			internal: EN,
			pluralization: {
				years: {
					zero: 'years',
					one: 'year',
					few: 'years',
					many: 'years',
					other: 'years',
				},
			},
			strings: {
				StartText: "It's a beautiful day outside, you open your eyes and meet...",
				HowOldAreYou: 'How old are you?',
				EnterYourName: 'Enter your name',
				EnterYourAge: 'Enter your age',
				AreYouLost: 'You are {{age}} {{age@years}}? Are you lost?',
				ChoiceAreYouLost: 'Are you lost?',
				YesHelpMe: 'Yes, help me',
			},
		},
	}),

	state: {
		age: 0,
	},

	data: {
		achievements: {
			money: false,
			love: false,
			cars: false,
		},
	},

	autosaves: true,

	initialScreen: 'mainmenu',
});

const { action, state, data, t, unwrap } = engine;

registerScreen('achievements', () => {
	return {
		mount() {
			return (
				<div>
					Твои Достижения
					<button type="button" class="button" data-novely-goto="mainmenu">
						Выйти
					</button>
				</div>
			);
		},
	};
});

registerMainmenuItem((goto) => ({
	type: 'button',
	class: 'button main-menu__button',
	textContent: unwrap({
		en: 'Achievements',
		ru: 'Достижения',
	}),
	onClick: () => {
		goto('achievements');
	},
}));

engine.withStory({
	start: [
		action.custom(hide()),
		action.text(t('StartText')),
		action.custom(particles(snow)),
		action.showBackground(outdoor),
		action.showCharacter('Lily', 'ok'),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog(
			'Lily',
			t({
				en: 'Hello!',
				ru: () => ['Привет!'],
			}),
		),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog('Lily', t('HowOldAreYou')),
		action.input(
			t('EnterYourAge'),
			({ input, error }) => {
				error(input.validationMessage);
				state({ age: input.valueAsNumber });
			},
			(input) => {
				input.setAttribute('type', 'number');
				input.setAttribute('min', '1');
				input.setAttribute('max', '99');
			},
		),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.condition(() => state().age <= 6, {
			true: [
				action.dialog('Lily', t('AreYouLost')),
				action.choice(t('AreYouLost'), [
					t('YesHelpMe'),
					[
						action.function(() => {
							data({ achievements: { money: true } });
						}),
						action.exit(),
					],
				]),
				action.exit(),
			],
			false: [action.exit()],
		}),
		action.end(),
	],
});

render(
	() => (
		<Novely
			style={{
				'--novely-settings-background-image': `url(${outdoor})`,
				'--novely-main-menu-background-image': `url(${outdoor})`,
				'--novely-saves-background-image': `url(${outdoor})`,
			}}
		/>
	),
	document.body,
);

export {};
