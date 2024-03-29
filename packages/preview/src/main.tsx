import { novely, RU, EN } from '@novely/core';
import { createSolidRenderer } from '@novely/solid-renderer';

import { particles, hide as hideParticles } from '@novely/particles';
import { snow } from './particles';

import { show, animate, hide as hideRive, remove } from '@novely/rive';

import outdoor from './assets/outdoor.png';
import lily_ok from './assets/lily.png';

/**
 * Peach by Sakura Girl | https://soundcloud.com/sakuragirl_official
 * Music promoted by https://www.chosic.com/free-music/all/
 * Creative Commons CC BY 3.0
 * https://creativecommons.org/licenses/by/3.0/
 */
import sakura_girl from './assets/sakura_girl.mp3';

import voice1 from './assets/voice/1.mp3'
import voice2 from './assets/voice/2.mp3'
import voice3 from './assets/voice/3.mp3'

const { emitter, renderer, registerScreen, registerMainmenuItem } = createSolidRenderer({
	fullscreen: false,
});

const engine = novely({
	renderer,

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
		You: {
			name: {
				ru: 'Ты',
				en: 'You'
			},
			color: '#000000',
			emotions: {}
		}
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
		},
	},

	state: {
		age: 0,
	},

	autosaves: true,

	initialScreen: 'mainmenu',

	preloadAssets: 'lazy',

	askBeforeExit: false,

	migrations: [
		(saved) => {
			if (saved && typeof saved === 'object' && 'saves' in saved && Array.isArray(saved.saves)) {
				saved.saves = saved.saves.filter((item) => Array.isArray(item) && item[2][0] > 1693459780762);
			}

			return saved;
		},
	],
});

const { action } = engine;

false && engine.script({
	start: [
		action.preload(outdoor),
		action.text('Нажимайте на текст для продолжения'),
		action.playMusic(sakura_girl),
		action.showBackground(outdoor),
		action.showCharacter('Lily', 'ok'),
		action.voice(voice1),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.say('Lily', 'Ну привет, мальчик-неудачник'),
		action.voice(voice2),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.say('Lily', 'Как же ты ничтожен...'),
		action.voice(voice3),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.say('Lily', 'Потому что ты не достоин!'),
	]
})

engine.script({
	'block:adv': [
		action.condition(() => true, {
			true: [
				action.text({
					en: 'You will be shown a full-screen ad',
					ru: 'Вам будет показана полноэкранная реклама',
				}),
			],
		}),
	],
	start: [
		action.preload(outdoor),
		action.text({
			en: 'You wake up, but do not see your keyboard anymore, instead...',
			ru: 'Вы просыпаетесь, но больше не видите своей клавиатуры, вместо неё...',
		}),
		action.playMusic(sakura_girl),
		action.custom(particles(snow)),
		action.showBackground(outdoor),
		action.showCharacter('Lily', 'ok'),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		// show('car', ({ init }) => {
		// 	init({
		// 		src: 'https://cdn.rive.app/animations/vehicles.riv',
		// 	});
		// }),
		// animate('car', 'curves'),
		action.say('Lily', {
			en: 'Hii~',
			ru: 'Привет',
		}),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.say('Lily', {
			en: 'Iʼm going to tell you about the Novely engine',
			ru: 'Я расскажу тебе про движок Novely',
		}),
		// animate('car', 'bounce'),
		action.say('You', {
			en: 'Great, something new. What kind of features does it offer?',
			ru: 'Отлично, что-то новое. Какие возможности он дает?',
		}),
		// animate('car', 'idle'),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.say('Lily', {
			en: 'Novely has many features: multi-language support, TypeScript support, and it is open source, multi-platform and lightweight.',
			ru: 'У Novely есть много преимуществ: поддержка нескольких языков, типизация на TypeScript, открытый исходный код, мультплатформенность и легковесность.',
		}),
		// remove('car'),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.say('Lily', {
			en: 'As a result, it can be used to create interactive stories and short stories with a minimum of effort.',
			ru: 'В итоге с его помощью можно создавать интерактивные истории и новеллы с минимумом усилий.',
		}),
		action.say('You', {
			en: 'Sounds promising. How easy is it to use?',
			ru: 'Звучит многообещающе. Насколько просто им пользоваться?',
		}),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.say('Lily', {
			en: "The Novely API is very simple and intuitive, so even a little programming experience is enough to start creating visual novels. And once you've studied the documentation, you'll get the hang of it!",
			ru: 'API Novely очень простой и интуитивный, так что даже небольшой опыт в программировании подойдёт чтобы начать создавать визуальные новеллы. А уж после изучения документации всё получится!',
		}),
		action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__pulse'),
		action.say('Lily', {
			en: 'By the way, how old are you?',
			ru: 'Кстати, сколько тебе лет?',
		}),
		action.input(
			{
				en: 'Enter youʼr age',
				ru: 'Введите ваш возраст',
			},
			({ input, error, state }) => {
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
		action.say('Lily', {
			en: "Ah, {{age}} {{age@years}} old? It's a wonderful age",
			ru: 'Ох, {{age}} {{age@years}}? Это прекрасный возраст',
		}),
		action.condition(() => true, {
			true: [
				action.text({
					en: 'The End',
					ru: 'Конец',
				}),
				// Проверка автоматического exit
			],
		}),
		action.jump('another'),
	],
});

engine.script({
	another: [
		action.showBackground(outdoor),
		action.say('Lily', {
			en: 'Part 2 Comes',
			ru: 'Часть 2'
		}),
	]
})

false && engine.script({
	start: [
		action.showBackground({
			'portrait': 'red',
			'landscape': 'green',
			'all': 'blue'
		}),
		action.text({
			en: 'Click to continue',
			ru: 'Нажмите, чтобы продолжить'
		}),
		action.showBackground('hotpink')
	]
})

export {};
