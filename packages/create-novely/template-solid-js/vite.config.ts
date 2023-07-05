import { defineConfig } from 'vite'
import { default as solidPlugin } from 'vite-plugin-solid'
import { plugin as pluginNvl } from '@novely/vite-plugin-nvl'

export default defineConfig(() => {
  return {
    plugins: [
      /**
       * Plugin that powers SolidJS
       */
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
      /**
       * Plugin for special story file format
       */
      pluginNvl
    ],
    build: {
      cssCodeSplit: false,
      target: ['chrome75', 'safari13'],
    },
    esbuild: {
      charset: 'utf8',
    },
    /**
     * Games is hosted on different resources, sometimes relative path is required
     */
    base: './'
  }
})
