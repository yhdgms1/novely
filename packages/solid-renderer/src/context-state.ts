import type { ContextImages } from './custom-actions/show-hide-image';
import { createContextStateRoot } from '@novely/renderer-toolkit';

const { useContextState, removeContextState } = createContextStateRoot(() => {
	return {
		images: [] as ContextImages,
		dialogOverviewShown: false,
		mood: '',
	};
});

type IContextState = ReturnType<typeof useContextState>;

export { useContextState, removeContextState };
export type { IContextState };
