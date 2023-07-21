# Getting Started

To use Novely, you will need a build tool. It is recommended to use [Vite](https://vitejs.dev/), although you can consider other options

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

## `index.html` and Project Root

As Novely's templates uses Vite, you can get all related information on [their website](https://vitejs.dev/guide/#index-html-and-project-root)

## Alternatives

Alternatively, you can install all needed packages by yourself

```bash
npm i @novely/core @novely/t9n
```

Since Novely has different ways to display the game, you should choose which renderer you will use. Note that each renderer is configured in a different ways.

In example, let's install solid renderer:

```bash
npm i @novely/solid-renderer solid-js # Note that solid-renderer requires solid-js
```

Currently, only solid-renderer is supported