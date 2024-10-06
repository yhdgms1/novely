import { noop } from './utilities';

type SetupBrowserVisibilityChangeListenersOptions = {
	onChange: () => void;
};

/**
 * Browser-only function.
 *
 * Tries to save data when page is switched OR is going to be unloaded
 */
const setupBrowserVisibilityChangeListeners = ({ onChange }: SetupBrowserVisibilityChangeListenersOptions) => {
	if (typeof document === 'undefined') return noop;

	const onVisibilityChange = () => {
		if (document.visibilityState === 'hidden') {
			onChange();
		}
	};

	addEventListener('visibilitychange', onVisibilityChange);
	addEventListener('beforeunload', onChange);

	return () => {
		removeEventListener('visibilitychange', onVisibilityChange);
		removeEventListener('beforeunload', onChange);
	};
};

export { setupBrowserVisibilityChangeListeners };
export type { SetupBrowserVisibilityChangeListenersOptions };
