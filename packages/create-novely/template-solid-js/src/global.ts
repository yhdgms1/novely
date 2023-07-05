import { createDeferredPromise } from './utilities';

/**
 * Resolve when game is fully initialized
 */
const initialized = createDeferredPromise();

initialized.promise.then(console.log)

export { initialized }
