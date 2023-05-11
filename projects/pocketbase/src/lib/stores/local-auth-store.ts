import { BaseAuthStore } from './base-auth-store';
import { Record } from '../models/record';
import { Admin } from '../models/admin';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { inject } from '@angular/core';

/**
 * The default token store for browsers with auto fallback
 * to runtime/memory if local storage is undefined (eg. in node env).
 */
export class LocalAuthStore extends BaseAuthStore {
	private storageFallback: { [key: string]: any } = {};
	private storageKey: string;
	private cookieService: SsrCookieService;

	constructor(storageKey = 'pocketbase_auth') {
		super();

		this.storageKey = storageKey;
		this.cookieService = inject(SsrCookieService);
	}

	/**
	 * @inheritdoc
	 */
	override get token(): string {
		const data = this._storageGet(this.storageKey) || {};

		return data.token || '';
	}

	/**
	 * @inheritdoc
	 */
	override get model(): Record | Admin | null {
		const data = this._storageGet(this.storageKey) || {};

		if (
			data === null ||
			typeof data !== 'object' ||
			data.model === null ||
			typeof data.model !== 'object'
		) {
			return null;
		}

		// admins don't have `collectionId` prop
		if (typeof data.model?.collectionId === 'undefined') {
			return new Admin(data.model);
		}

		return new Record(data.model);
	}

	/**
	 * @inheritdoc
	 */
	override save(token: string, model: Record | Admin | null) {
		this._storageSet(this.storageKey, {
			token: token,
			model: model
		});

		super.save(token, model);
	}

	/**
	 * @inheritdoc
	 */
	override clear() {
		this._storageRemove(this.storageKey);

		super.clear();
	}

	// ---------------------------------------------------------------
	// Internal helpers:
	// ---------------------------------------------------------------

	/**
	 * Retrieves `key` from the browser's local storage
	 * (or runtime/memory if local storage is undefined).
	 */
	private _storageGet(key: string): any {
		if (this.cookieService) {
			const rawValue = this.cookieService.get(key) || '';
			try {
				return JSON.parse(rawValue);
			} catch (e) {
				// not a json
				return rawValue;
			}
		}

		// fallback
		return this.storageFallback[key];
	}

	/**
	 * Stores a new data in the browser's local storage
	 * (or runtime/memory if local storage is undefined).
	 */
	private _storageSet(key: string, value: any) {
		if (this.cookieService) {
			// store in local storage
			let normalizedVal = value;
			if (typeof value !== 'string') {
				normalizedVal = JSON.stringify(value);
			}
			this.cookieService.set(key, normalizedVal);
		} else {
			// store in fallback
			this.storageFallback[key] = value;
		}
	}

	/**
	 * Removes `key` from the browser's local storage and the runtime/memory.
	 */
	private _storageRemove(key: string) {
		// delete from local storage
		if (this.cookieService) {
			this.cookieService.delete(key);
		}

		// delete from fallback
		delete this.storageFallback[key];
	}
}
