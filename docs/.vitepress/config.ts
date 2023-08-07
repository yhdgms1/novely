import { defineConfig } from 'vitepress'
import fs from 'fs'

const grammar = JSON.parse(fs.readFileSync('./docs/.vitepress/novely.tmLanguage.json', 'utf8'));

export default defineConfig({
  title: "Novely",
  description: "Create Interactive Stories with Ease",
  themeConfig: {
    search: {
      provider: "local",
    },

    nav: [
      { text: "Home", link: "/" },
      { text: "Docs", link: "/guide/getting-started" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Configuration", link: "/guide/configuration" },
          { text: "Translation", link: "/guide/translation" },
          { text: "Characters", link: "/guide/characters" },
          { text: "Other Options", link: "/guide/other-options" },
          { text: "Story", link: "/guide/story" },
          {
            text: "Actions",
            items: [
              { text: "About Actions", link: "/guide/actions/about" },
              { text: "Choice", link: "/guide/actions/choice" },
              { text: "Clear", link: "/guide/actions/clear" },
              { text: "Condition", link: "/guide/actions/condition" },
              { text: "Dialog", link: "/guide/actions/dialog" },
              { text: "End", link: "/guide/actions/end" },
              { text: "Function", link: "/guide/actions/function" },
              { text: "Input", link: "/guide/actions/input" },
              { text: "Jump", link: "/guide/actions/jump" },
              { text: "PlayMusic", link: "/guide/actions/playMusic" },
              { text: "StopMusic", link: "/guide/actions/stopMusic" },
              { text: "ShowBackground", link: "/guide/actions/showBackground" },
              { text: "ShowCharacter", link: "/guide/actions/showCharacter" },
              {
                text: "AnimateCharacter",
                link: "/guide/actions/animateCharacter",
              },
              { text: "HideCharacter", link: "/guide/actions/hideCharacter" },
              { text: "Wait", link: "/guide/actions/wait" },
              { text: "Vibrate", link: "/guide/actions/vibrate" },
              { text: "Next", link: "/guide/actions/next" },
              { text: "Exit", link: "/guide/actions/exit" },
              { text: "Custom", link: "/guide/actions/custom" },
              { text: "Preload", link: "/guide/actions/preload" },
            ],
            collapsed: false,
          },
          {
            text: "Another Actions",
            items: [
              { text: "Summary", link: "/guide/another-actions/summary" },
              { text: "Video", link: "/guide/another-actions/video" },
              { text: "Particles", link: "/guide/another-actions/particles" },
            ],
            collapsed: true,
          },
          {
            text: "Story Format",
            link: "/guide/story-format",
          },
          {
            text: "Demo",
            link: "/demo/demo",
          },
          {
            text: "Standalone Package",
            link: "/guide/standalone",
          },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/yhdgms1/novely" },
    ],

    footer: {
      message: `Released under the ISC License.`,
      copyright: "Copyright © 2023-present Artemiy Schukin & Contributors",
    },
  },

  markdown: {
    languages: [
      {
        id: "novely",
        scopeName: "novely",
        aliases: ["novely"],
        grammar: grammar,
        path: ".",
      },
    ],
  },
});