import { engine } from './engine'
import { createDeferredPromise } from './utilities';

const { withStory, t, action: a, state } = engine;

/**
 * Resolve when game is fully initialized
 */
const initialized = createDeferredPromise();

withStory({
  start: [
    a.showBackground('#000000'),
    a.text('You wake up in the school class room, you see a girl next to you'),
    a.showBackground('https://i.imgur.com/2CtCDxs.png'),
    a.showCharacter('Natsuki', 'astonished', '', 'left: 15%'),
    a.dialog(undefined, 'Uh, hi'),
    a.dialog('Natsuki', 'Hey, who are you? And where the heck are we?'),
    a.dialog(undefined, ' I don\'t know, I just woke up here too.'),
    a.dialog('Natsuki', 'Great, just great. This is just what I needed, being trapped in a mysterious classroom with a complete stranger.'),
    a.dialog('Natsuki', 'What is this, some kind of sick joke?'),
    a.dialog(undefined, 'I don\'t think it\'s a joke. Maybe we should try to find a way out of here?'),
    a.dialog('Natsuki', 'Yeah, no kidding. I don\'t want to be stuck in this creepy classroom forever.'),
    a.dialog('Natsuki', 'Let\'s look around and see if we can find anything that might help us.'),
    a.dialog(undefined, 'Okay, sounds like a plan. But, uh, who are you exactly?'),
    a.dialog('Natsuki', 'My name is Natsuki. And you are...?'),
    a.input(
      'What is your name?',
      ({ input, error }) => {
        /**
         * Set the error, or remove it
         */
        error(input.validationMessage);

        if (!input.validationMessage) {
          state({ name: input.value });
        }
      },
      (input) => {
        input.setAttribute('type', 'string');
        input.setAttribute('min', '2');
        input.setAttribute('max', '46');
      }
    ),
    a.dialog('Natsuki', 'Well, {{name}}, let\'s get to work. We have a classroom to escape from.'),
    a.end()
  ],
});

initialized.resolve(0);

export { initialized }
