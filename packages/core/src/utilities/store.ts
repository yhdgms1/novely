import type { Stored } from '../store';
import type { Lang, StorageData } from '../types';

const getLanguageFromStore = <$Language extends Lang>(store: Stored<StorageData<$Language, any>>) => {
	return store.get().meta[0];
};

const getVolumeFromStore = <$Language extends Lang>(store: Stored<StorageData<$Language, any>>) => {
	const { meta } = store.get();

	return {
		music: meta[2],
		sound: meta[3],
		voice: meta[4],
	};
};

export { getLanguageFromStore, getVolumeFromStore };
