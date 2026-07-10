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

```javascript
import { createHardtacks } from 'sveltekit-hardtack-cookies';

const hardtacks = createHardtacks(
	{
		// schemas can be sync or async
		name: string(),
		age: {
			read: stringToNumber(),
			write: numberToString()
		},
		date: {
			read: stringToDate(),
			write: dateToString()
		}
	},
	{
		// provide default cookie config (optional)
		httpOnly: true,
		secure: true
	}
);
```

### Usage

```javascript
const date = await hardtacks.date.get();

// Get with fallback, fallback value will be returned if cookie is not set or validation fails
const name = await hardtacks.name.get('Guest');
const age = await hardtacks.age.get(0);

// Uses default cookie config
const age = await hardtacks.age.set(10);

await hardtacks.name.set('User', {
	// override default cookie config (will be shallow-merged with default)
	httpOnly: false
});

// Will not run validatation, returns false if cookie value is undefined or null
await hardtacks.name.has();

// Will run validatation
// If validation fails, will return false
await hardtacks.name.hasValid();
```

### Encrypt/Sign Cookies

```javascript
const hardtacks = createHardtacks(
	{
		//...schema here
	},
	{
		// ...config here
	},
	// provide encryption/signing (jointly optional; if you provide encrypt you must provide decrypt and vice versa)
	{
		// functions can be sync or async
		async encrypt(value) {
			return await signJwt(value, myKey);
		},
		async decrypt(value) {
			try {
				return await verifyJwt(value, myKey);
			} catch {
				// can return null or undefined, validation will still run
				return null;
			}
		}
	}
);
```

If your `encrypt(...)`/`decrypt(...)` functions throw errors, make sure you catch these errors when calling the `.set(...)`/`.get(...)`/`.has()` methods.
