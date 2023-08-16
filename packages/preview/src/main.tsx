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
			strings: {},
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
			strings: {},
		},
	}),

	state: {
		age: 15,
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

	preloadAssets: 'lazy'
});

const { action, state, data, t, unwrap } = engine;

registerScreen('achievements', () => {
	return {
		mount() {
			return (
				<div class="root saves">
					<div class="saves__column">
						<button type="button" class="button saves__button" data-novely-goto="mainmenu">
							{unwrap({
								en: 'Exit',
								ru: 'Выйти'
							})}
						</button>
					</div>
					<div class="saves__list-container">
						<table>
							<caption>
								{unwrap({
									en: 'Youʼr achievements',
									ru: 'Твои достижения'
								})}
							</caption>
							<thead>
								<tr>
									<th scope="col">
										{unwrap({
											en: 'Money',
											ru: 'Деньги'
										})}
									</th>
									<th scope="col">
										{unwrap({
											en: 'Love',
											ru: 'Любовь'
										})}
									</th>
									<th scope="col">
										{unwrap({
											en: 'Cars',
											ru: 'Тачки'
										})}
									</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>
										{unwrap({
											en: data().achievements.money ? 'Yes' : 'No',
											ru: data().achievements.money ? 'Да' : 'Нет',
										})}
									</td>
									<td>
										{unwrap({
											en: data().achievements.love ? 'Yes' : 'No',
											ru: data().achievements.love ? 'Да' : 'Нет',
										})}
									</td>
									<td>
										{unwrap({
											en: data().achievements.cars ? 'Yes' : 'No',
											ru: data().achievements.cars ? 'Да' : 'Нет',
										})}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
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
		action.preload(outdoor),
		action.text(t({
			en: 'You wake up, but do not see your keyboard anymore, instead...',
			ru: 'Вы просыпаетесь, но больше не видите своей клавиатуры, вместо неё...'
		})),
		action.custom(particles(snow)),
		action.showBackground(outdoor),
		action.showCharacter('Lily', 'ok'),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog(
			'Lily',
			t({
				en: 'Hii~',
				ru: 'Привет',
			}),
		),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog(
			'Lily',
			t({
				en: 'Iʼm going to tell you about the Novely engine',
				ru: 'Я расскажу тебе про движок Novely',
			}),
		),
		action.dialog(
			'You',
			t({
				en: 'Great, something new. What kind of features does it offer?',
				ru: 'Отлично, что-то новое. Какие возможности он дает?',
			}),
		),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog(
			'Lily',
			t({
				en: 'Novely has many features: multi-language support, TypeScript support, and it is open source, multi-platform and lightweight.',
				ru: 'У Novely есть много преимуществ: поддержка нескольких языков, типизация на TypeScript, открытый исходный код, мультплатформенность и легковесность.',
			}),
		),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog(
			'Lily',
			t({
				en: 'As a result, it can be used to create interactive stories and short stories with a minimum of effort.',
				ru: 'В итоге с его помощью можно создавать интерактивные истории и новеллы с минимумом усилий.',
			}),
		),
		action.dialog(
			'You',
			t({
				en: 'Sounds promising. How easy is it to use?',
				ru: 'Звучит многообещающе. Насколько просто им пользоваться?',
			}),
		),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog(
			'Lily',
			t({
				en: 'The Novely API is very simple and intuitive, so even a little programming experience is enough to start creating visual novels. And once you\'ve studied the documentation, you\'ll get the hang of it!',
				ru: 'API Novely очень простой и интуитивный, так что даже небольшой опыт в программировании подойдёт чтобы начать создавать визуальные новеллы. А уж после изучения документации всё получится!',
			}),
		),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog(
			'Lily',
			t({
				en: 'By the way, how old are you?',
				ru: 'Кстати, сколько тебе лет?'
			}),
		),
		action.input(
			t({
				en: 'Enter you\'r age',
				ru: 'Введите ваш возраст'
			}),
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
		action.dialog(
			'Lily',
			t({
				en: "Ah, {{age}} {{age@years}} old? It's a wonderful age",
				ru: "Ох, {{age}} {{age@years}}? Это прекрасный возраст",
			})
		),
		action.condition(() => true, {
			true: [
				action.text(t({
					en: 'The End',
					ru: 'Конец'
				})),
				// Проверка автоматического exit
			]
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
