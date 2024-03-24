import type { DeepMapStore, AllPaths, FromPath, BaseDeepMap } from "nanostores";
import { getPath } from "nanostores";

const storeUpdate = <T extends BaseDeepMap, K extends AllPaths<T>, V extends FromPath<T, K>>(store: DeepMapStore<T>, path: K, setter: (value: V) => V) => {
  const value = getPath(store.get() as BaseDeepMap, path);
  const newer = setter(value as V);

  // @ts-expect-error Ignore this
  store.setKey(path, newer);
}

export { storeUpdate }
