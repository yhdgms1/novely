import { render } from 'solid-js/web'
import { Novely } from './engine'
import { setup } from './story'

import outdoor from './assets/outdoor.png'

const App = () => {
	const background = `url("${outdoor}")`

	return (
		<Novely
			style={{
				'--novely-main-menu-background-image': background,
				'--novely-settings-background-image': background,
				'--novely-saves-background-image': background,
			}}
		/>
	)
}

setup()
render(() => <App />, document.body)
