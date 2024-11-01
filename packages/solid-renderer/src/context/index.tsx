import { useMedia } from '$hooks';
import { from } from '$utils';
import type {
	BaseTranslationStrings,
	Context,
	CoreData,
	Renderer,
	RendererInit,
	StorageData,
	Stored,
} from '@novely/core';
import type { DeepAtom, RendererStateStore } from '@novely/renderer-toolkit';
import type { Accessor, FlowComponent } from 'solid-js';
import { Show, createContext, useContext } from 'solid-js';
import type { Emitter } from '../emitter';
import type { EmitterEventsMap, RendererStoreExtension } from '../types';
import type { createAudio } from '@novely/renderer-toolkit';

type DataContext = {
	$rendererState: DeepAtom<RendererStateStore<RendererStoreExtension>>;

	storageData: Accessor<StorageData>;
	storageDataUpdate: (fn: (prev: StorageData) => StorageData) => void;

	coreData: Accessor<CoreData>;
	coreDataUpdate: (fn: (prev: CoreData) => CoreData) => void;

	options: RendererInit<any, any>;
	renderer: Renderer;

	t: (key: BaseTranslationStrings | (string & Record<never, never>)) => string;

	emitter: Emitter<EmitterEventsMap>;

	media: {
		hyperWide: Accessor<boolean>;
	};

	getContext: (name: string) => Context;
	removeContext: (name: string) => void;

	audio: ReturnType<typeof createAudio>;
};

const Context = createContext<DataContext>();

type ProviderProps = {
	$rendererState: DeepAtom<RendererStateStore<RendererStoreExtension>>;

	storageData: Stored<StorageData>;
	coreData: Stored<CoreData>;

	options: RendererInit<any, any>;
	renderer: Renderer;

	emitter: Emitter<EmitterEventsMap>;

	getContext: (name: string) => Context;
	removeContext: (name: string) => void;

	audio: ReturnType<typeof createAudio>;
};

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
			return props.options.t(key as BaseTranslationStrings, storageData().meta[0]);
		},

		emitter: props.emitter,

		media: {
			hyperWide: useMedia('(max-aspect-ratio: 0.26)'),
		},

		getContext: props.getContext,
		removeContext: props.removeContext,

		audio: props.audio,
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
