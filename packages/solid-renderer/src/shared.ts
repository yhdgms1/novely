import { createShared } from '@novely/renderer-toolkit';
import type { SolidRendererStore } from './types';

const { useShared, removeShared } = createShared<SolidRendererStore>(() => {
	return {
		characters: {},
	};
});

export { useShared, removeShared };
