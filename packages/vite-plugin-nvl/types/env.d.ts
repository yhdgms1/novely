import type { DefaultActionProxyProvider } from '@novely/core';

type StoryObject = Record<string, unknown>;

declare module '*.nvl' {
	const FN: (actions: DefaultActionProxyProvider, parameters: Record<string, unknown>) => StoryObject;
	export default FN;
}

declare module '*.nvly' {
	const FN: (actions: DefaultActionProxyProvider, parameters: Record<string, unknown>) => StoryObject;
	export default FN;
}

declare module '*.nly' {
	const FN: (actions: DefaultActionProxyProvider, parameters: Record<string, unknown>) => StoryObject;
	export default FN;
}
