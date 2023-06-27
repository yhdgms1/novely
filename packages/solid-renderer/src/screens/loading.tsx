import type { VoidComponent } from 'solid-js'

interface LoadingProps { }

const Loading: VoidComponent<LoadingProps> = () => {
  return (
    <div class="root loading">
      <div class="loading__animation">
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  )
}

export { Loading }