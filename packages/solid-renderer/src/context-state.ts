import { createContextStateRoot } from '@novely/renderer-toolkit';

const { useContextState, removeContextState } = createContextStateRoot(() => {
	return {
		images: {} as Record<string, HTMLImageElement | undefined>,
	};
});

type IContextState = ReturnType<typeof useContextState>;

export { useContextState, removeContextState };
export type { IContextState };
