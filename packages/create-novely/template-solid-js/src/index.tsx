import { render } from 'solid-js/web'
import { solidRenderer } from './engine'
import { end } from './story'

const { Novely } = solidRenderer;

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

end();

render(() => <App />, document.body);
