// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const once = <T extends (...args: any[]) => any>(fn: T) => {
  let called = false
  return (...params: Parameters<T>) => {
    if (!called) {
      called = true;
      fn(...params)
    }
  }
}

export { once }
