import type { VoidComponent } from 'solid-js'

import { style } from '../styles/styles';

interface LoadingProps { }

const Loading: VoidComponent<LoadingProps> = () => {
  return (
    <div
      classList={{
        [style.root]: true,
        [style.loading]: true
      }}
    >
      <div class={style.ldsEllipsis}><div></div><div></div><div></div><div></div></div>
    </div>
  )
}

export { Loading }