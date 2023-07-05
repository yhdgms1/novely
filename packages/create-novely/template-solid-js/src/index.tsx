import { render } from 'solid-js/web'
import { Novely } from './engine'
import { setup } from './story'

const App = () => {
  const background = 'url("https://i.imgur.com/y9zRBhe.png")';

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

setup();
render(() => <App />, document.body);
