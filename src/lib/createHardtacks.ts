import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Cookies } from '@sveltejs/kit';

import { getRequestEvent } from '$app/server';

type GetCookieConfig = Parameters<Cookies['get']>[1];
type CookieConfig = Parameters<Cookies['set']>[2];

export type Hardtack<O> = {
	/**
	 * Get the value from the cookie store. Throws on validation error.
	 * @returns {Promise<O | undefined>}
	 * @throws {StandardSchemaV1.Issue[]}
	 */
	get(config?: GetCookieConfig): Promise<O | undefined>;

	/**
	 * Get the value from the cookie store. Uses the fallback if the value is missing. Throws on validation error.
	 * @param {O} fallbackIfMissing Value to return if cookie value is missing.
	 * @returns {Promise<O>}
	 * @throws {StandardSchemaV1.Issue[]}
	 */
	get(fallbackIfMissing: O, config?: GetCookieConfig): Promise<O>;

	/**
	 * Sets the value in the cookie store. Throws on validation error.
	 * @param {O} value
	 * @param {CookieConfig?} config Optional config to pass to the cookie store. Same types as `next/headers`. Merged with default config if provided.
	 * @throws {StandardSchemaV1.Issue[]}
	 */
	set(value: O, config?: CookieConfig): Promise<void>;

	/**
	 * Checks if the cookie store has the key. Validation is not performed.
	 * @returns {Promise<boolean>}
	 */
	has(config?: GetCookieConfig): Promise<boolean>;

	/**
	 * Checks if the cookie store has the key. Validation is performed.
	 * @returns {Promise<boolean>}
	 */
	hasValid(config?: GetCookieConfig): Promise<boolean>;

	/**
	 * Deletes the key from the cookie store. Validation is not performed.
	 * @returns {Promise<void>}
	 */
	delete(config?: CookieConfig): Promise<void>;
};

type HardtackInput = Record<string, StandardSchemaV1<string> | Codec<unknown>>;

type Codec<Output> = {
	read: StandardSchemaV1<string, Output>;
	write: StandardSchemaV1<Output, string>;
};

type ExtractOutput<T extends Codec<unknown> | StandardSchemaV1<string>> =
	T extends Codec<infer Output>
		? Output
		: T extends StandardSchemaV1<string, infer Output>
			? Output
			: never;

export type HardtacksBox<I extends HardtackInput> = {
	[Key in keyof I]: Hardtack<ExtractOutput<I[Key]>>;
};

/**
 * Creates cookie accessors with provided schemas
 * @param {I} input
 * @param {CookieConfig?} defaultCookieConfig Optional default config to pass to the cookie store. Same types as `next/headers`.
 * @param {Encryption?} encryption Optional encryption functions to use. If not provided, the default is to leave the values as-is.
 * @returns {HardtacksBox<I>}
 */
export function createHardtacks<I extends HardtackInput>(
	input: I,
	defaultCookieConfig: CookieConfig,
	encryption?: {
		encrypt: (value: string) => Promise<string> | string;
		decrypt: (value: string) => Promise<string | null | undefined> | string | null | undefined;
	}
): HardtacksBox<I> {
	const base: Record<string, Hardtack<unknown>> = {};
	const encrypt = encryption?.encrypt ?? ((value: string) => value);
	const decrypt = encryption?.decrypt ?? ((value: string) => value);

	for (const [key, schema] of Object.entries(input)) {
		const read = 'read' in schema ? schema.read : schema;
		const write = 'write' in schema ? schema.write : schema;

		base[key] = {
			async get(fallback?: unknown, config?: GetCookieConfig) {
				const { cookies } = getRequestEvent();

				const unsafeValue = cookies.get(key, config);
				if (unsafeValue == null) return fallback;

				const result = await read['~standard'].validate(await decrypt(unsafeValue));

				if (result.issues) return fallback;

				return result.value;
			},
			async set(value: unknown, config?: CookieConfig) {
				const { cookies } = getRequestEvent();
				const result = await write['~standard'].validate(value);

				if (result.issues) throw result.issues;

				cookies.set(key, await encrypt(result.value), {
					...defaultCookieConfig,
					...config
				});
			},
			async has(config?: GetCookieConfig) {
				const { cookies } = getRequestEvent();
				return cookies.get(key, config) != null;
			},
			async hasValid(config?: GetCookieConfig) {
				const { cookies } = getRequestEvent();

				const unsafeValue = cookies.get(key, config);
				if (unsafeValue == null) return false;

				const result = await read['~standard'].validate(await decrypt(unsafeValue));

				if (result.issues) return false;

				return result.value != null;
			},
			async delete(config?: CookieConfig) {
				const { cookies } = getRequestEvent();
				cookies.delete(key, { ...defaultCookieConfig, ...config });
			}
		};
	}

	return base as HardtacksBox<I>;
}
