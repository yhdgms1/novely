# @novely/flex-storage

Flex storage uses [seroval](https://github.com/lxsmnsyc/seroval) for serializing/deserializing and  [lz-string](https://github.com/pieroxy/lz-string) for compression/decompression.

## Usage

```ts
import { flexStorage, adapterLocalStorage } from '@novely/flex-storage';

const storage = flexStorage({
	adapter: adapterLocalStorage()
})

const engine = novely({
  ...,
  storage
});
```
