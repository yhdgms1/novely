import memoize from 'micro-memoize';

const avif = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";
const jxl  = "data:image/jxl;base64,/woIAAAMABKIAgC4AF3lEgAAFSqjjBu8nOv58kOHxbSN6wxttW1hSaLIODZJJ3BIEkkaoCUzGM6qJAE=";
const webp = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";

const supportsFormat = (source: string) => {
  const { promise, resolve } = Promise.withResolvers<boolean>();

  const img = Object.assign(document.createElement('img'), {
    src: source
  })

  img.onload = img.onerror = () => {
    resolve(img.height === 2);
  }

  return promise;
}

const supportsMap = {
  avif: false,
  jxl: false,
  webp: false
}

const formatsMap = {
  avif,
  jxl,
  webp
} as const;

const getImageFormatsSupport = memoize(async () => {
  const promises = [];

  for (const [format, source] of Object.entries(formatsMap)) {
    const promise = supportsFormat(source).then(supported => {
      supportsMap[format as keyof typeof supportsMap] = supported;
    });

    promises.push(promise);
  }

  await Promise.all(promises);

  return supportsMap;
});

export { getImageFormatsSupport }
