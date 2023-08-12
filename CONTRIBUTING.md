# Novely Contributing Guide

## Repo Setup

To develop locally, fork the repository and clone it in your local machine. The Novely repo is a monorepo using pnpm workspaces. The package manager used to install and link dependencies must be [pnpm](https://pnpm.io/).

1. Run `pnpm i` in the root folder.

2. Run `pnpm build:t9n && pnpm build:core && pnpm build:typewriter && pnpm build:solid` in the root folder.

## Pull Request Guidelines

- Checkout a topic branch from a base branch (e.g. `main`), and merge back against that branch.
- Do NOT run the `pnpm run format` command, instead, use Prettier extension in your code editor

## TypeScript

Please, you TypeScript.

You can add `any` in new code, but not in existing code. You can use `as` as you want.

## ESLint

You can ignore eslint messages.
