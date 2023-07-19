import type { VoidComponent, JSX } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import type { State } from "../renderer";

import { For, createUniqueId, createMemo } from "solid-js";
import { capitalize } from "../utils";
import { useData } from "../context";

interface SettingsProps {
  setState: SetStoreFunction<State>;
}

const Settings: VoidComponent<SettingsProps> = (props) => {
  const data = useData();

  const language = () => data.storeData().meta[0];
  const textSpeed = () => data.storeData().meta[1];

  const languageNames = createMemo(
    () =>
      new Intl.DisplayNames([language()], {
        type: "language",
      }),
  );

  const onLanguageSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = ({
    currentTarget: { value },
  }) => {
    data.storeDataUpdate((prev) => {
      return (prev.meta[0] = value), prev;
    });
  };

  const onSpeedSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = ({
    currentTarget: { value },
  }) => {
    data.storeDataUpdate((prev) => {
      return (prev.meta[1] = value), prev;
    });
  };

  const languageSelectID = createUniqueId();
  const speedSelectID = createUniqueId();

  return (
    <div class="root settings">
      <div class="settings__column">
        <button
          type="button"
          class="button settings__button"
          onClick={() => props.setState("screen", "mainmenu")}
        >
          {data.t("HomeScreen")}
        </button>
        <button
          type="button"
          class="button settings__button"
          onClick={() => data.options.restore()}
        >
          {data.t("ToTheGame")}
        </button>
      </div>
      <div class="settings__column">
        <div class="select">
          <label class="select__label" for={languageSelectID}>
            {data.t("Language")}
          </label>
          <select
            class="select__select"
            id={languageSelectID}
            onChange={onLanguageSelect}
          >
            <For each={data.options.languages}>
              {(lang) => (
                <option value={lang} selected={lang === language()}>
                  {capitalize(languageNames().of(lang) || lang)}
                </option>
              )}
            </For>
          </select>
        </div>
        <div class="select">
          <label class="select__label" for={speedSelectID}>
            {data.t("TextSpeed")}
          </label>
          <select
            class="select__select"
            id={speedSelectID}
            onChange={onSpeedSelect}
          >
            <For each={["Slow", "Medium", "Fast", "Auto"]}>
              {(speed) => (
                <option value={speed} selected={speed === textSpeed()}>
                  {data.t("TextSpeed" + speed)}
                </option>
              )}
            </For>
          </select>
        </div>
      </div>
    </div>
  );
};

export { Settings };
