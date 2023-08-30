import { isArray, propertyIsOnObject, propertyIsUnsafe, isMergeableObject, keys } from './utils';

const empty = <T extends (Record<PropertyKey, unknown> | unknown[])>(value: T): T => {
  return (isArray(value) ? [] : {}) as T;
}

const clone = <T>(value: T): T => {
  return isMergeableObject(value)
    ? deepmerge(empty(value), value)
    : value;
}

const mergeArray = <T>(target: T[], source: T[]) => {
  const destination = target.slice();

  source.forEach((item, index) => {
    if (typeof destination[index] === 'undefined') {
      destination[index] = clone(item);
    } else if (isMergeableObject(item)) {
      destination[index] = deepmerge(target[index] as any, item as any);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });

  return destination;
}

const mergeObject = <T extends Record<PropertyKey, unknown>>(target: T, source: T): T => {
  const destination: Record<PropertyKey, any> = {};

  for (const key of keys(target)) {
    destination[key] = clone(target[key]);
  }

  for (const key of keys(source)) {
    if (propertyIsUnsafe(target, key)) {
      continue;
    }

    if (propertyIsOnObject(target, key) && isMergeableObject(source[key])) {
      destination[key] = deepmerge(target[key] as any, source[key] as any);
    } else {
      destination[key] = clone(source[key]);
    }
  }

  return destination as unknown as T;
}

const deepmerge = <T extends (Record<PropertyKey, unknown> | unknown[])>(target: T, source: T): T => {
  if (isArray(target) && isArray(source)) {
    const merged = mergeArray(target, source);

    return merged as unknown as T;
  } else if (!isArray(target) && !isArray(source)) {
    const merged = mergeObject(target, source);

    return merged as unknown as T;
  } else {
    return clone(source);
  }
}

export { deepmerge }
