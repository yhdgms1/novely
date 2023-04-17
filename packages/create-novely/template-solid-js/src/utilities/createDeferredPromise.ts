const createDeferredPromise = () => {
  let resolve!: (value: unknown) => void, reject!: (value: unknown) => void;

  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve, reject = _reject;
  });

  return { promise, resolve, reject }
}

export { createDeferredPromise }
