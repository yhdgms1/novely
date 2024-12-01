import { defineConfig } from "vitepress";
import fs from "node:fs";

const grammar = JSON.parse(
  fs.readFileSync("./docs/.vitepress/novely.tmLanguage.json", "utf8")
);

export default defineConfig({
  title: "Novely",
  description: "Create Interactive Stories with Ease",
  themeConfig: {
    logo: {
      src: "/logo.svg",
    },

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
        collapsed: false,
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Configuration", link: "/guide/configuration" },
          { text: "State", link: "/guide/state" },
          { text: "Game States", link: "/guide/game-states" },
          { text: "Translation", link: "/guide/translation" },
          { text: "Characters", link: "/guide/characters" },
          { text: "Assets", link: "/guide/assets" },
          { text: "Other Options", link: "/guide/other-options" },
          { text: "Story", link: "/guide/story" },
          {
            text: "Actions",
            collapsed: true,
            items: [
              { text: "About Actions", link: "/guide/actions/about" },
              { text: "Choice", link: "/guide/actions/choice" },
              { text: "Condition", link: "/guide/actions/condition" },
              { text: "Block", link: "/guide/actions/block" },
              { text: "Clear", link: "/guide/actions/clear" },
              { text: "Dialog", link: "/guide/actions/dialog" },
              { text: "Say", link: "/guide/actions/say" },
              { text: "End", link: "/guide/actions/end" },
              { text: "Function", link: "/guide/actions/function" },
              { text: "Input", link: "/guide/actions/input" },
              { text: "Jump", link: "/guide/actions/jump" },

              { text: "PlayMusic", link: "/guide/actions/playMusic" },
              { text: "StopMusic", link: "/guide/actions/stopMusic" },
              
              { text: "PlaySound", link: "/guide/actions/playSound" },
              { text: "StopSound", link: "/guide/actions/stopSound" },

              { text: "Voice", link: "/guide/actions/voice" },
              { text: "StopVoice", link: "/guide/actions/stopVoice" },

              { text: "ShowBackground", link: "/guide/actions/showBackground" },
              { text: "ShowCharacter", link: "/guide/actions/showCharacter" },
              {
                text: "AnimateCharacter",
                link: "/guide/actions/animateCharacter",
              },
              { text: "HideCharacter", link: "/guide/actions/hideCharacter" },
              { text: "Wait", link: "/guide/actions/wait" },
              { text: "Vibrate", link: "/guide/actions/vibrate" },
              { text: "Text", link: "/guide/actions/text" },
              { text: "Next", link: "/guide/actions/next" },
              { text: "Exit", link: "/guide/actions/exit" },
              { text: "Custom", link: "/guide/actions/custom" },
              { text: "Preload", link: "/guide/actions/preload" },
            ],
          },
          {
            text: "Another Actions",
            items: [
              { text: "Particles", link: "/guide/another-actions/particles" },
              { text: "Moment Presser", link: "/guide/another-actions/moment-presser" },
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
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/yhdgms1/novely" },
    ],

    footer: {
      message: 'Released under the ISC License.',
      copyright: "Copyright © 2023-present Artemiy Schukin & Contributors",
    },
  },

  markdown: {
    languages: [
      {
        ...grammar,
        name: 'novely'
      }
    ],
    theme: {
      light: 'light-plus',
      dark: 'dark-plus'
    }
  },

  head: [
    ["link", { rel: "icon", href: "/logo.svg" }],
    ["meta", { name: "theme-color", content: "#10b981" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:site_name", content: "Novely" }],
  ],
});
