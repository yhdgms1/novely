import type { VoidComponent, JSX } from 'solid-js'
import type { TypewriterSpeed } from '@novely/core'
import { untrack, createEffect, onCleanup, createSignal } from 'solid-js'
import { typewriter as initiateTypewriter } from '@novely/typewriter'
import { TEXT_SPEED_MAP } from '../constants'

interface TypewriterProps {
  content: string | undefined;
  speed: TypewriterSpeed;
  ended: (prefersReducedMotion: boolean) => void;

  attributes?: JSX.HTMLAttributes<HTMLSpanElement>;
}

interface CreateTypewriterOptions {
  resolve: () => void;
}

const PRM = matchMedia('(prefers-reduced-motion: reduce)');

const createTypewriter = ({ resolve }: CreateTypewriterOptions) => {
  /**
   * In example PRM was enabled, text was set, then PRM was disabled.
   * 
   * Is writer done? No.
   * Is PRM enabled? No.
   * 
   * This is used to overcome this situation.
   */
  let bypassed = false;
  let typewriter: ReturnType<typeof initiateTypewriter> | undefined;

  const [state, setState] = createSignal<"processing" | "done" | "idle">("idle");
  
  const Typewriter: VoidComponent<TypewriterProps> = (props) => {
    let node!: HTMLSpanElement;
    
    createEffect(() => {
      const text = props.content;

      typewriter?.destroy();

      setState('idle');

      if (!text) return;
      if (!node) return;

      if (PRM.matches) {
        /**
         * Spaces replaces here for consistency
         */
        node.innerHTML = text.replace(/ /gm, '&#8197;');
        bypassed = true;

        setState('done');
  
        return;
      }

      setState('processing');

      typewriter = initiateTypewriter({
        node,
        text,
        ended() {
          setState('done');
          untrack(() => props.ended(PRM.matches));
        },
        speed: TEXT_SPEED_MAP[untrack(() => props.speed)]
      });
  
      bypassed = false;
    });

    onCleanup(() => {
      setState('idle');

      typewriter?.destroy();
      bypassed = false;
    })

    return <span ref={node} {...props.attributes} />;
  }

  const clear = () => {
    const reduced = PRM.matches;
    const written = typewriter && typewriter.end();

    if (reduced || written || bypassed) {
      bypassed = false;
      setState('idle');
      resolve();
    } else {
      setState('done');
    }
  }

  return {
    Typewriter,
    clear,
    state
  }
}

export { createTypewriter }