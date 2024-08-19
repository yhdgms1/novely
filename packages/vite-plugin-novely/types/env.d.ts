import type { DefaultActionProxyProvider } from '@novely/core';

type StoryObject = Record<string, unknown>;

declare module '*.novely' {
	const FN: (actions: DefaultActionProxyProvider, parameters: Record<string, unknown>) => StoryObject;
	export default FN;
}
