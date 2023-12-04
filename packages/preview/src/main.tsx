import { novely } from '@novely/core';
import { createT9N, RU, EN } from '@novely/t9n';
import { createSolidRenderer } from '@novely/solid-renderer';

import { particles, hide as hideParticles } from '@novely/particles';
import { snow } from './particles';

import { show, animate, hide as hideRive, remove } from '@novely/rive';

import outdoor from './assets/outdoor.png';
import lily_ok from './assets/lily.png';

const { createRenderer, registerScreen, registerMainmenuItem } = createSolidRenderer({
	fullscreen: false,
});

const engine = novely({
	languages: ['ru', 'en'],
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

	translation: {
		ru: {
			internal: RU,
			plural: {
				years: {
					zero: 'лет',
					one: 'год',
					few: 'года',
					many: 'лет',
				},
			},
		},
		en: {
			internal: EN,
			plural: {
				years: {
					zero: 'years',
					one: 'year',
					few: 'years',
					many: 'years',
					other: 'years',
				},
			},
		}
	},

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

	initialScreen: 'game',

	preloadAssets: 'blocking',

	askBeforeExit: false,

	migrations: [
		(saved) => {
			if (saved && typeof saved === 'object' && 'saves' in saved && Array.isArray(saved.saves)) {
				saved.saves = saved.saves.filter((item) => Array.isArray(item) && item[2][0] > 1693459780762);
			}

			return saved;
		}
	]
});

const { action, state, data, unwrap } = engine;

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

// registerMainmenuItem((goto) => ({
// 	type: 'button',
// 	class: 'button main-menu__button',
// 	textContent: unwrap({
// 		en: 'Achievements',
// 		ru: 'Достижения',
// 	}),
// 	onClick: () => {
// 		goto('achievements');
// 	},
// }));

engine.withStory({
	'block:adv': [
		action.condition(() => true, {
			true: [
				action.text({
					en: 'You will be shown a full-screen ad',
					ru: 'Вам будет показана полноэкранная реклама',
				}),
			]
		}),
	],
	start: [
		action.custom(hideParticles()),
		hideRive('car'), //same as particles needs to be cleared at start
		action.preload(outdoor),
		action.text({
			en: 'You wake up, but do not see your keyboard anymore, instead...',
			ru: 'Вы просыпаетесь, но больше не видите своей клавиатуры, вместо неё...'
		}),
		action.custom(particles(snow)),
		action.showBackground(outdoor),
		action.showCharacter('Lily', 'ok'),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		show('car', ({ init }) => {
			init({
				src: 'https://cdn.rive.app/animations/vehicles.riv',
			});
		}),
		animate('car', 'curves'),
		action.dialog('Lily', {
			en: 'Hii~',
			ru: 'Привет',
		}),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog('Lily',	{
			en: 'Iʼm going to tell you about the Novely engine',
			ru: 'Я расскажу тебе про движок Novely',
		}),
		animate('car', 'bounce'),
		action.dialog('You', {
			en: 'Great, something new. What kind of features does it offer?',
			ru: 'Отлично, что-то новое. Какие возможности он дает?',
		}),
		animate('car', 'idle'),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog('Lily', {
			en: 'Novely has many features: multi-language support, TypeScript support, and it is open source, multi-platform and lightweight.',
			ru: 'У Novely есть много преимуществ: поддержка нескольких языков, типизация на TypeScript, открытый исходный код, мультплатформенность и легковесность.',
		}),
		remove('car'),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog('Lily', {
			en: 'As a result, it can be used to create interactive stories and short stories with a minimum of effort.',
			ru: 'В итоге с его помощью можно создавать интерактивные истории и новеллы с минимумом усилий.',
		}),
		action.dialog('You', {
			en: 'Sounds promising. How easy is it to use?',
			ru: 'Звучит многообещающе. Насколько просто им пользоваться?',
		}),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog('Lily', {
			en: 'The Novely API is very simple and intuitive, so even a little programming experience is enough to start creating visual novels. And once you\'ve studied the documentation, you\'ll get the hang of it!',
			ru: 'API Novely очень простой и интуитивный, так что даже небольшой опыт в программировании подойдёт чтобы начать создавать визуальные новеллы. А уж после изучения документации всё получится!',
		}),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.dialog('Lily', {
			en: 'By the way, how old are you?',
			ru: 'Кстати, сколько тебе лет?'
		}),
		action.input(
			{
				en: `Enter you'r age`,
				ru: 'Введите ваш возраст'
			},
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
		action.dialog('Lily', {
			en: "Ah, {{age}} {{age@years}} old? It's a wonderful age",
			ru: "Ох, {{age}} {{age@years}}? Это прекрасный возраст",
		}),
		action.condition(() => true, {
			true: [
				action.text({
					en: 'The End',
					ru: 'Конец'
				}),
				// Проверка автоматического exit
			]
		}),
		action.end(),
	],
	'another': [
		action.function(() => {
			console.log('GOT ANOTHER')
			// engine.script({
			// 	'test': [
			// 		action.dialog('Lily', 'Hiii')
			// 	]
			// })
		}),
		action.dialog('Lily', 'He hee'),
		action.end()
		// action.jump('test')
	]
});

export {};
