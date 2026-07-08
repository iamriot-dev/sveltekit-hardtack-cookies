# SvelteKit Hardtack Cookies

A library to make your SvelteKit cookies typesafe

## Installation

```bash
npm install sveltekit-hardtack-cookies
# or
yarn add sveltekit-hardtack-cookies
# or
pnpm add sveltekit-hardtack-cookies
```

## Usage

### Setup

```ts
import { createHardtacks } from "sveltekit-hardtack-cookies";

const hardtacks = createHardtacks({
  name: string(),
  age: {
    read: stringToNumber(),
    write: numberToString(),
  },
  date: {
    read: stringToDate(),
    write: dateToString(),
  },
});
```

### Usage

```ts
const name = awaixt hardtacks.name.get("Guest");
const age = await hardtacks.age.get(0);
const date = await hardtacks.date.get();
```
