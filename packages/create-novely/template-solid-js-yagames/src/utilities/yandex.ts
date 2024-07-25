import type { StorageData } from '@novely/core'
import { createDeferredPromise } from '.'

declare global {
	interface Window {
		YaGames?: {
			init: () => any;
		}
	}
}

type Games =
	| {
			loaded: Promise<void>
	  }
	| {
			loaded: Promise<void>
			sdk: any

			player: Record<string, unknown> | null

			get: () => Promise<StorageData>
			set: (data: StorageData) => Promise<void>
	  }

type LoadedSDK = Extract<Games, { sdk: any }>

const initialized = createDeferredPromise()

const games = {
	loaded: initialized.promise,
	player: null,
} as LoadedSDK

const local = {
	async get(): ReturnType<LoadedSDK['get']> {
		const data = localStorage.getItem('novely-save')

		if (data) {
			try {
				return JSON.parse(data)
			} catch {
				/**
				 *  Novely сам установит всё необходимое
				 */
				return { meta: [], saves: [] } as unknown as StorageData
			}
		}

		return { meta: [], saves: [] } as unknown as StorageData
	},
	async set(data: Parameters<LoadedSDK['set']>[0]) {
		localStorage.setItem('novely-save', JSON.stringify(data))
	},
}

const load = async () => {
	if (!window.YaGames) return

	const sdk = await window.YaGames.init()

	let player;

	try {
		player = await sdk.getPlayer({
			scopes: false,
		})
	} catch (error) {
		/**
		 * В случае режима черепахи
		 */
		player = {
			getData: local.get,
			setData: local.set,
		}
	}

	games.sdk = sdk
	games.player = player

	games.get = async () => {
		const localSave = local.get()

		try {
			const cloud = await player.getData()

			/**
			 * Можно реализовать более полную проверку
			 */
			if (Object.keys(cloud).length === 0) {
				return localSave
			}

			return cloud
		} catch {
			games.get = local.get

			return localSave
		}
	}

	games.set = async data => {
		try {
			await player.setData(data)
		} catch {
			games.set = local.set

			await local.set(data)
		}
	}

	/**
	 * После запуска этой функции Novely производит запрос для получения сохранений
	 */
	initialized.resolve()
}

load()

export { games }
