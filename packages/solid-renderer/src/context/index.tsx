import type { Accessor, FlowComponent } from 'solid-js';
import type { Renderer, RendererInit, StorageData, Stored, BaseTranslationStrings } from '@novely/core';

import { from, createContext, useContext, Show } from 'solid-js';
import { useMedia } from '$hooks';

interface DataContext {
	storeData: Accessor<StorageData>;
	storeDataUpdate: (fn: (prev: StorageData) => StorageData) => void;

	options: RendererInit;
	renderer: Renderer;

	t: (key: BaseTranslationStrings | (string & Record<never, never>)) => string;

	media: {
		hyperWide: Accessor<boolean>
	}
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
		storeData: storeData as Accessor<StorageData>,
		storeDataUpdate: props.storeData.update,

		options: props.options,
		renderer: props.renderer,

		t(key: BaseTranslationStrings | (string & Record<never, never>)) {
			return props.options.t(key as BaseTranslationStrings, this.storeData().meta[0]);
		},

		media: {
			hyperWide: useMedia('(max-aspect-ratio: 0.26)')
		}
	};

	return (
		<Context.Provider value={value}>
			<Show when={storeData()}>{props.children}</Show>
		</Context.Provider>
	);
};

const useData = () => {
	return useContext(Context)!;
};

export { Provider, useData };
