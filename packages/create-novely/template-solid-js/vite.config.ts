import { defineConfig } from 'vite'
import { default as solidPlugin } from 'vite-plugin-solid'

export default defineConfig(() => {
  return {
    plugins: [
      solidPlugin({
        babel: {
          babelrc: false,
          browserslistConfigFile: false,
          configFile: false,
          highlightCode: false,
          plugins: [],
        },
        hot: false,
        ssr: false,
      }),
    ],
    build: {
      cssCodeSplit: false,
      target: ['chrome75', 'safari13'],
    },
    esbuild: {
      charset: 'utf8',
    },
    base: './'
  }
})
