import { createDeferredPromise } from './utilities';

/**
 * Resolve when game is fully initialized
 */
const initialized = createDeferredPromise();

export { initialized }
