import type { VoidComponent, JSX } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import type { State } from "../renderer";
import { createEffect, createSignal, Show } from "solid-js";

interface CustomScreenProps {
  name: string;

  state: State;
  setState: SetStoreFunction<State>;
}

const CustomScreen: VoidComponent<CustomScreenProps> = (props) => {
  const [dom, setDOM] = createSignal<Element | JSX.Element | null>(null);

  let unmount: undefined | (() => void);

  createEffect(() => {
    /**
     * Clear previous screen effects
     */
    if (unmount) unmount();

    /**
     * CustomScreen is always rendered, so this check is required
     */
    if (props.state.screen in props.state.screens) {
      const current = props.state.screens[props.state.screen]();

      setDOM(current.mount());
      unmount = current.unmount;

      return;
    }

    setDOM(null);
    unmount = undefined;
  });

  const onClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = ({
    target,
  }) => {
    if (target instanceof HTMLElement && target.dataset.novelyGoto) {
      props.setState("screen", target.dataset.novelyGoto);
    }
  };

  return (
    <Show when={dom()}>
      <div class="root custom" onClick={onClick}>
        {dom()}
      </div>
    </Show>
  );
};

export { CustomScreen };
