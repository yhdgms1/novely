import type { Accessor, FlowComponent } from 'solid-js';
import type { Renderer, RendererInit, StorageData, Stored, BaseTranslationStrings } from '@novely/core';

import { from, createContext, useContext } from "solid-js";

interface DataContext {
  storeData: Accessor<StorageData | undefined>;
  storeDataUpdate: (fn: (prev: StorageData) => StorageData) => void;

  options: RendererInit;
  renderer: Renderer;

  t: (key: BaseTranslationStrings) => string;
}

const Context = createContext<DataContext>();

interface ProviderProps {
  storeData: Stored<StorageData>;

  options: RendererInit;
  renderer: Renderer;
}

const Provider: FlowComponent<ProviderProps> = (props) => {
  const storeData = from(props.storeData);

  const value: DataContext = {
    storeData: storeData,
    storeDataUpdate: props.storeData.update,

    options: props.options,
    renderer: props.renderer,

    t: (key: BaseTranslationStrings) => {
      return props.options.t(key, storeData()!.meta[0])
    }
  }

  return (
    <Context.Provider value={value}>
      {props.children}
    </Context.Provider>
  )
}

const useData = () => {
  return useContext(Context)!;
}

export { Provider, useData }