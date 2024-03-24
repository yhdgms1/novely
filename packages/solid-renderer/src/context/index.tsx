import type { Accessor, FlowComponent } from 'solid-js';
import type { Renderer, RendererInit, StorageData, Stored, BaseTranslationStrings, CoreData, Character, Context } from '@novely/core';
import type { EmitterEventsMap, RendererStoreExtension, SolidContext } from '../types';
import type { Emitter } from '../emitter';

import { from, createContext, useContext, Show } from 'solid-js';
import { useMedia } from '$hooks';
import { DeepMapStore, RendererStateStore } from '@novely/renderer-toolkit';

interface DataContext {
	$rendererState: DeepMapStore<RendererStateStore<RendererStoreExtension>>;

	storageData: Accessor<StorageData>;
	storageDataUpdate: (fn: (prev: StorageData) => StorageData) => void;

	coreData: Accessor<CoreData>;
	coreDataUpdate: (fn: (prev: CoreData) => CoreData) => void;

	options: RendererInit;
	renderer: Renderer;

	t: (key: BaseTranslationStrings | (string & Record<never, never>)) => string;

	emitter: Emitter<EmitterEventsMap>;

	media: {
		hyperWide: Accessor<boolean>;
	};

	characters: Record<string, Character>;

	getContext: (name: string) => SolidContext;
	removeContext: (name: string) => void;
}

const Context = createContext<DataContext>();

interface ProviderProps {
	$rendererState: DeepMapStore<RendererStateStore<RendererStoreExtension>>;

	storageData: Stored<StorageData>;
	coreData: Stored<CoreData>;

	options: RendererInit;
	renderer: Renderer;

	emitter: Emitter<EmitterEventsMap>;

	characters: Record<string, Character>;

	getContext: (name: string) => SolidContext;
	removeContext: (name: string) => void;
}

const Provider: FlowComponent<ProviderProps> = (props) => {
	const storageData = from(props.storageData) as Accessor<StorageData>;
	const coreData = from(props.coreData) as Accessor<CoreData>;

	const value: DataContext = {
		$rendererState: props.$rendererState,

		storageData: storageData,
		storageDataUpdate: props.storageData.update,

		coreData: coreData,
		coreDataUpdate: props.coreData.update,

		options: props.options,
		renderer: props.renderer,

		t(key: BaseTranslationStrings | (string & Record<never, never>)) {
			return props.options.t(
				key as BaseTranslationStrings,
				storageData().meta[0]
			);
		},

		emitter: props.emitter,

		media: {
			hyperWide: useMedia('(max-aspect-ratio: 0.26)'),
		},

		characters: props.characters,

		getContext: props.getContext,
		removeContext: props.removeContext
	};

	return (
		<Context.Provider value={value}>
			<Show when={storageData()}>{props.children}</Show>
		</Context.Provider>
	);
};

const useData = () => {
	return useContext(Context)!;
};

export { Provider, useData };
