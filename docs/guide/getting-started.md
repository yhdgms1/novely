# Getting Started

## Scaffolding Your First Novely Project

With NPM:

```bash
npm create novely@latest
```

With Yarn:

```bash
yarn create novely
```

With PNPM:

```bash
pnpm create novely
```

Then follow the prompts!

## Project Root

Some of Novely's templates uses Vite, you can get all related information on [their website](https://vitejs.dev/guide/#index-html-and-project-root).

## Alternatives

### Standalone Package

You might not want to use bundler. Here you go! We have a [@novely/standalone](https://www.npmjs.com/package/@novely/standalone) package. Basically, you just need to add it to your project using CDN or placing script alongside your `index.html`. You can read more about standalone package [here](/guide/standalone)

### All By Yourself

Alternatively, you can install all needed packages by yourself

```bash
npm i @novely/core
```

Since Novely has different ways to display the game, you should choose which renderer you will use. Note that each renderer is configured in a different ways.

In example, let's install solid renderer:

```bash
npm i @novely/solid-renderer solid-js # Note that solid-renderer requires solid-js
```

Currently, only solid-renderer is supported