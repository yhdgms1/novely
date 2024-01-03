import type { Accessor, FlowComponent } from 'solid-js';
import type { Renderer, RendererInit, StorageData, Stored, BaseTranslationStrings, CoreData } from '@novely/core';
import type { EmitterEventsMap } from '../types';
import type { Emitter } from '../emitter';

import { from, createContext, useContext, Show } from 'solid-js';
import { useMedia } from '$hooks';

interface DataContext {
	storeData: Accessor<StorageData>;
	storeDataUpdate: (fn: (prev: StorageData) => StorageData) => void;

	coreData: Accessor<CoreData>;
	coreDataUpdate: (fn: (prev: CoreData) => CoreData) => void;

	options: RendererInit;
	renderer: Renderer;

	t: (key: BaseTranslationStrings | (string & Record<never, never>)) => string;

	emitter: Emitter<EmitterEventsMap>;

	media: {
		hyperWide: Accessor<boolean>;
	};
}

const Context = createContext<DataContext>();

interface ProviderProps {
	storeData: Stored<StorageData>;
	coreData: Stored<CoreData>;

	options: RendererInit;
	renderer: Renderer;

	emitter: Emitter<EmitterEventsMap>;
}

const Provider: FlowComponent<ProviderProps> = (props) => {
	const storeData = from(props.storeData) as Accessor<StorageData>;
	const coreData = from(props.coreData) as Accessor<CoreData>;

	const value: DataContext = {
		storeData: storeData,
		storeDataUpdate: props.storeData.update,

		coreData: coreData,
		coreDataUpdate: props.coreData.update,

		options: props.options,
		renderer: props.renderer,

		t(key: BaseTranslationStrings | (string & Record<never, never>)) {
			return props.options.t(key as BaseTranslationStrings, this.storeData().meta[0]);
		},

		emitter: props.emitter,

		media: {
			hyperWide: useMedia('(max-aspect-ratio: 0.26)'),
		},
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
