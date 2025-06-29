import {
	TypesFromEngine,
	CustomHandler,
	EN,
	RU,
	Story,
	TextContent,
	ValidAction,
	asset,
	extendAction,
	novely,
	pauseOnBlur,
} from '@novely/core';
import { adapterLocalStorage, cloneFunction, flexStorage } from '@novely/flex-storage';
import { createRenderer } from '@novely/solid-renderer';

import { hideParticles, showParticles } from '@novely/particles';
import { snow } from './particles';

import '@novely/moment-presser/style.css';
import { createMomentPresser } from '@novely/moment-presser';
import type { CreateMomentPresserOptions } from '@novely/moment-presser';

import lily_ok_png from './assets/lily.png';
import outdoor_png from './assets/outdoor.png';
import green from './assets/green.png';
import orange from './assets/orange.png';

import { generateEmotions } from '@novely/dynamic-character';

generateEmotions;

/**
 * Peach by Sakura Girl | https://soundcloud.com/sakuragirl_official
 * Music promoted by https://www.chosic.com/free-music/all/
 * Creative Commons CC BY 3.0
 * https://creativecommons.org/licenses/by/3.0/
 */
import sakura_girl from './assets/sakura_girl.mp3';

import narrator0000 from './assets/narrator0000.mp3';

const { emitter, renderer, registerScreen, registerMainmenuItem } = createRenderer({
	fullscreen: false,
});

const storage = flexStorage({
	adapter: adapterLocalStorage({
		key: 'askd2192n',
	}),
});

const outdoor = asset(outdoor_png);
const music = asset(sakura_girl);

const engine = novely({
	renderer,
	storage,

	characters: {
		Lily: {
			name: {
				ru: 'Лилия',
				en: 'Lily',
			},
			color: '#ed5c87',
			emotions: {
				ok: [asset(lily_ok_png)],
			},
		},
		You: {
			name: {
				ru: 'Ты',
				en: 'You',
			},
			color: '#000000',
			emotions: {},
		},
	},

	defaultEmotions: {
		Lily: 'ok',
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
		current: 0,
	},

	data: {
		purchases: new Set<'choice__start__rude'>(),
	},

	autosaves: true,

	initialScreen: 'mainmenu',

	preloadAssets: 'automatic',

	askBeforeExit: false,

	migrations: [
		(saved) => {
			if (saved && typeof saved === 'object' && 'saves' in saved && Array.isArray(saved.saves)) {
				saved.saves = saved.saves.filter((item) => Array.isArray(item) && item[2][0] > 1736950090610);
			}

			return saved;
		},
	],

	storyOptions: {
		mode: 'dynamic',
		preloadSaves: 9,
		load: async (scene): Promise<Story> => {
			console.log(`Load called ${scene}`);

			if (scene === 'part_2') {
				await new Promise((r) => setTimeout(r, 2700));

				return {
					part_2: [
						engine.action.showBackground('red'),
						engine.action.showCharacter('Lily', 'ok'),
						engine.action.dialog('Lily', 'PART 2 HERE YO'),
						engine.action.jump('part_3'),
					],
				};
			}

			if (scene === 'part_3') {
				await new Promise((r) => setTimeout(r, 5000));

				return {
					part_3: [
						engine.action.showBackground('hotpink'),
						engine.action.showCharacter('Lily', 'ok'),
						engine.action.dialog('Lily', 'This is part three'),
					],
				};
			}

			throw new Error(`Unknown scene: ${scene}`);
		},
	},
});

type Types = TypesFromEngine<typeof engine>;

const action = extendAction(engine.action, {
	particles: (options: Parameters<typeof showParticles>[0]) => {
		return ['custom', showParticles(options)];
	},
	momentPresser: (onPressed: CreateMomentPresserOptions<Types>['onPressed']) => {
		const momentPresser = createMomentPresser<Types>({
			onPressed: onPressed,
			translation: {
				ru: {
					stop: 'Стоп',
				},
				en: {
					stop: 'Stop',
				},
			},
		});

		return ['custom', momentPresser];
	},
	talk: (character: keyof Types['c'], text: TextContent<Types['l'], Types['s']>) => {
		return [
			engine.action.animateCharacter(character, 'animate__animated animate__pulse'),
			engine.action.say(character, text),
		];
	},
	setCharacterOpacity: (character: keyof Types['c'], opacity: number) => {
		const fn: CustomHandler = ({ clear, getDomNodes }) => {
			const { root } = getDomNodes();

			const PROPERTY_KEY = `--character-${character}-opacity`;

			root.style.setProperty(PROPERTY_KEY, String(opacity));
			clear(() => root.style.removeProperty(PROPERTY_KEY));
		};

		fn.id = `set-opacity`;
		fn.key = `set-opacity-${character}`;

		return ['custom', fn];
	},
});

pauseOnBlur(engine);

false &&
	engine.script({
		start: [action.showBackground(outdoor), action.dialog('Lily', 'HELLO'), action.jump('part_2')],
	});

true &&
	engine.script({
		start: [
			action.particles(snow),
			action.showBackground(outdoor),
			action.playMusic(sakura_girl),
			action.say('Lily', {
				en: 'Hello',
				ru: 'Привет',
			}),
			action.say('Lily', {
				en: 'Hello 2',
				ru: 'Привет 2',
			}),
			action.say('Lily', {
				en: 'Hello 3',
				ru: 'Привет 3',
			}),
			action.momentPresser((_, state) => console.log(state)),
			action.say('Lily', {
				en: 'Hello 4',
				ru: 'Привет 5',
			}),
			action.say('Lily', {
				en: 'Hello 5',
				ru: 'Привет 5',
			}),
			action.end(),
		],
	});

false &&
	engine.script({
		start: [
			action.next(),
			action.text({
				en: 'You wake up, but do not see your keyboard anymore, instead...',
				ru: 'Вы просыпаетесь, но больше не видите своей клавиатуры, вместо неё...',
			}),
			action.playMusic(music),
			action.particles(snow),
			action.showBackground(outdoor),
			action.showCharacter('Lily', 'ok', '', 'opacity: var(--character-Lily-opacity, 1)'),
			action.talk('Lily', {
				en: 'Hii~',
				ru: 'Привет!',
			}),
			action.talk('Lily', {
				en: 'Iʼm going to tell you about the Novely engine',
				ru: 'Я расскажу тебе про движок Novely',
			}),
			action.say('You', {
				en: 'Great, something new. What kind of features does it offer?',
				ru: 'Отлично, что-то новое. Какие возможности он дает?',
			}),
			action.animateCharacter('Lily', 'animate__animated animate__pulse'),
			action.say('Lily', {
				en: 'Novely has many features: multi-language support, TypeScript support, and it is open source, multi-platform and lightweight.',
				ru: 'У Novely есть много преимуществ: поддержка нескольких языков, типизация на TypeScript, открытый исходный код, мультплатформенность и легковесность.',
			}),
			action.animateCharacter('Lily', 'animate__animated animate__pulse'),
			action.say('Lily', {
				en: 'As a result, it can be used to create interactive stories and short stories with a minimum of effort.',
				ru: 'В итоге с его помощью можно создавать интерактивные истории и новеллы с минимумом усилий.',
			}),
			action.say('You', {
				en: 'Sounds promising. How easy is it to use?',
				ru: 'Звучит многообещающе. Насколько просто им пользоваться?',
			}),
			action.animateCharacter('Lily', 'animate__animated animate__pulse'),
			action.say('Lily', {
				en: "The Novely API is very simple and intuitive, so even a little programming experience is enough to start creating visual novels. And once you've studied the documentation, you'll get the hang of it!",
				ru: 'API Novely очень простой и интуитивный, так что даже небольшой опыт в программировании подойдёт чтобы начать создавать визуальные новеллы. А уж после изучения документации всё получится!',
			}),
			action.animateCharacter('Lily', 'animate__animated animate__pulse'),
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
			action.animateCharacter('Lily', 'animate__animated animate__pulse'),
			action.say('Lily', {
				en: "Ah, {{age}} {{age@years}} old? It's a wonderful age",
				ru: 'Ох, {{age}} {{age@years}}? Это прекрасный возраст',
			}),
			action.text({
				en: 'The End',
				ru: 'Конец',
			}),
			action.end(),
		],
	});

false &&
	engine.script({
		start: [
			action.showBackground({
				'(orientation: portrait)': 'red',
				'(orientation: landscape)': 'green',
				all: 'blue',
			}),
			action.text({
				en: 'Click to continue',
				ru: 'Нажмите, чтобы продолжить',
			}),
			action.showBackground('hotpink'),
		],
	});

false &&
	engine.script({
		start: [
			action.particles(snow),
			action.showBackground(outdoor),
			action.showCharacter('Lily'),
			action.input(
				'Something',
				({ error, input, value }) => {
					input.value = input.value.trimStart();

					error(input.validationMessage);

					if (!input.validationMessage) {
						console.log(value.trim());
					}
				},
				(input) => {
					input.setAttribute('minlength', '2');
					input.setAttribute('maxlength', '20');

					return () => {
						// Useless because that input is removed anyway but the point is to cleanup in a returned function
						input.removeAttribute('minlength');
						input.removeAttribute('maxlength');
					};
				},
			),
		],
	});

false &&
	engine.script({
		start: [
			action.playMusic(music),
			action.particles(snow),
			action.showBackground(outdoor),
			action.showCharacter('Lily', 'ok', '', 'opacity: var(--character-Lily-opacity, 1)'),
			action.choice(
				'Who would you like to meet? #1',
				{
					title: '',
					children: [action.function(() => console.log('#1'))],
					image: lily_ok_png,
				},
				{
					title: '',
					children: [action.function(() => console.log('#2'))],
					image: lily_ok_png,
				},
			),
			action.choice(
				'Who would you like to meet? #2',
				['', [action.function(() => console.log('#3'))], undefined, undefined, undefined, lily_ok_png],
				['', [action.function(() => console.log('#4'))], undefined, undefined, undefined, lily_ok_png],
			),
			action.say('Lily', {
				en: "So what's your name?",
				ru: 'Так как зовут тебя?',
			}),
			// todo: find out why two action above are needed for automatic `end` to work
			action.end(),
		],
	});

false &&
	engine.script({
		start: [
			action.showBackground(outdoor),
			action.showImage(asset.image(green), {
				classesIn: 'animate__animated animate__fadeIn',
				wait: true,
			}),
			action.say('Lily', '1'),
			action.hideImage(asset.image(green), {
				classesOut: 'animate__animated animate__fadeOut',
				wait: true,
			}),
			action.showImage(asset.image(orange)),
			action.say('Lily', '2'),
			action.hideImage(asset.image(orange)),
			action.say('Lily', '3'),
		],
	});

false &&
	engine.script({
		start: [
			action.showBackground(outdoor),
			action.showCharacter('Lily', 'ok'),
			action.choice(
				'Заголовок вопроса',
				{
					title: 'Ответить вежливо',
					children: [action.function(() => console.log('Вежливый ответ'))],
				},
				{
					title: 'Ответить грубо',
					children: [action.say('You', 'Шо ты чепуха, фарту масти')],
					active: () => {
						return engine.data().purchases.has('choice__start__rude');
					},
					onSelect: () => {
						if (engine.data().purchases.has('choice__start__rude')) {
							return;
						}

						const { promise, resolve } = Promise.withResolvers<void>();

						console.log('Showing ad...');

						setTimeout(() => {
							console.log('Ad is shown');
							console.log('Item purchased');

							engine.data().purchases.add('choice__start__rude');

							resolve();
						}, 3000);

						return promise;
					},
				},
			),
		],
	});

false &&
	engine.script({
		start: [
			action.playMusic(music),
			action.particles(snow),
			action.showBackground(outdoor),
			action.voice(narrator0000),
			action.text('Water, earth, fire, air. Long ago the four nations lived together in harmony'),
			action.say('Lily', 'Current: {{current}}'),
			action.function(({ state, restoring, goingBack }) => {
				if (!restoring && !goingBack) {
					state({ current: state().current + 1 });
				}
			}),
			action.say('Lily', 'Current: {{current}}'),
			action.function(({ state, restoring, goingBack }) => {
				if (!restoring && !goingBack) {
					state({ current: state().current + 1 });
				}
			}),
			action.say('Lily', 'Current: {{current}}'),
			action.function(({ state, restoring, goingBack }) => {
				if (!restoring && !goingBack) {
					state({ current: state().current + 1 });
				}
			}),
			action.voice(narrator0000),
			action.say('Lily', 'Current: {{current}}'),
			action.function(({ state, restoring, goingBack }) => {
				if (!restoring && !goingBack) {
					state({ current: state().current + 1 });
				}
			}),
			action.say('Lily', 'Current: {{current}}'),
			action.function(({ state, restoring, goingBack }) => {
				if (!restoring && !goingBack) {
					state({ current: state().current + 1 });
				}
			}),
			action.say('Lily', 'End'),
		],
	});
