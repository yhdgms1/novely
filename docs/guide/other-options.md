# Other Options

There are options that are completely not necessary for setting up, so you can skip that paragraph.

## Options

### Autosaves

```ts
const engine = novely({
  ...,
  autosaves: false
})
```

This options controls whether Novely will create "auto" saves or not.

### Migrations

```ts
const engine = novely({
  ...,
  migrations: [
    (saved) => {
      if (saved && typeof saved === 'object') {

        if ('saves' in saved && Array.isArray(saved.saves)) {
          for (const save of saved.saves) {
            if (Array.isArray(save) && typeof save[1] === 'object') {
              // Modify save
            }
          }
        }

        if ('meta' in saved && Array.isArray(saved.meta)) {
          // Update meta
        }

        if ('data' in saved && typeof saved.data === 'object') {
          // Update global data
        }

      }

      return saved;
    }
  ]
})
```

Migrations allow you to run some functions over the saved data before engine started to work with them. Internal format might change, or you want to add new property in the save's `state` or to the global `data` – this is all for the migrations.

### ThrottleTimeout

```ts
const engine = novely({
  ...,
  throttleTimeout: 1000
})
```

Whenever player plays the game, the data changes. It might be auto save, or a settings change, global data change, manual save and etc. Frequent updates are not necessary and even harmful. Also, some game platforms limit how often you can set the data. So you can configure how often data will be synced. 

### GetLanguage

```ts
const sdk = MyGamePlatformSDK();

const engine = novely({
  ...,
  translation: {
    en: {
      internal: EN
    },
    kk: {
      internal: KK
    }
  },
  getLanguage(languages) {
    // ['en', 'kk'] <- This is taken from `translation` option above
    console.log(languages)

    // Example usage
    if (languages.includes(sdk.environment.i18n.lang)) {
      return sdk.environment.i18n.lang;
    }

    return 'en'
  }
})
```
Here you can give game the language here. By default, Novely will check the browsers language, but your platform may require different way of setting the language up.

### Storage

```ts
import { localStorageStorage } from 'novely';

const engine = novely({
  ...,
  storage: localStorageStorage({ key: 'awd' })
})
```

Storage is an object with `get` and `set` functions. By default novely uses `localStorageStorage` function that being exported. 

### StorageDelay

```ts
const sdk = MyGamePlatformSDK();

const engine = novely({
  ...
  storageDelay: sdk.loaded,

  storage: {
    async get() {
      return await sdk.getData()
    },
    async set(data) {
      await sdk.setData(data)
    }
  }
})
```

You can control when Novely will get initial data. In example, you get your save from some platform's sdk, but it requires you to wait until it loaded.

### PreloadAssets

```ts
const engine = novely({
  ...
  preloadAssets: 'blocking' // or 'lazy'
})
```

You can control how Novely will load game assets. 

#### Blocking

Before game starts Novely will download all the backgrounds and user expressions used in game. Loading screen will be shown.

#### Lazy

Default mode. Nothing will be loaded before. Backgrounds and etc will be loaded when used. You still can preload some assets by using [preload](/guide/actions/preload) action

### Fetch

```ts
const engine = novely({
  ...,
  fetch: (...args) => {
    console.log(`Fetching with args: ` args);

    return window.fetch(...args);
  }
})
```

Novely uses `fetch` in some places, if you want to override fetch function you can pass it here