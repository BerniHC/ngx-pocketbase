import { Inject, Injectable } from '@angular/core';
import {
	HttpClient,
	HttpHeaders,
	HttpResponse,
	HttpResponseBase
} from '@angular/common/http';
import { Observable, catchError, lastValueFrom, map } from 'rxjs';
import { PocketBaseConfig } from '../../pocketbase.module';
import { CollectionService } from '../collection/collection.service';
import { BaseAuthStore } from '../../stores/base-auth-store';
import { Record } from '../../models/record';
import { ClientResponseError } from '../../models/client-response-error';
import { BaseQueryParams, FileQueryParams } from '../../models/query-params';
import { LocalAuthStore } from '../../stores/local-auth-store';
import { RealtimeService } from '../realtime/realtime.service';
import { RecordService } from '../record/record.service';
import { SettingsService } from '../settings/settings.service';
import { AdminService } from '../admin/admin.service';
import { FileService } from '../file/file.service';
import { LogService } from '../log/log.service';
import { HealthService } from '../health/health.service';

export interface SendOptions extends RequestInit {
	headers?: { [key: string]: string };
	body?: any;
	params?: BaseQueryParams;
}

export interface BeforeSendResult {
	[key: string]: any; // for backward compatibility
	url?: string;
	options?: { [key: string]: any };
}

@Injectable()
export class PocketBaseService {
	/**
	 * The base PocketBase backend url address (eg. 'http://127.0.0.1.8090').
	 */
	public baseUrl: string;

	/**
	 * Hook that get triggered right before sending the fetch request,
	 * allowing you to inspect and modify the url and request options.
	 *
	 * For list of the possible options check https://developer.mozilla.org/en-US/docs/Web/API/fetch#options
	 *
	 * You can return a non-empty result object `{ url, options }` to replace the url and request options entirely.
	 *
	 * Example:
	 * ```js
	 * client.beforeSend = function (url, options) {
	 *     options.headers = Object.assign({}, options.headers, {
	 *         'X-Custom-Header': 'example',
	 *     });
	 *
	 *     return { url, options }
	 * };
	 * ```
	 */
	public beforeSend?: (
		url: string,
		options: SendOptions
	) => BeforeSendResult | Promise<BeforeSendResult>;

	/**
	 * Hook that get triggered after successfully sending the fetch request,
	 * allowing you to inspect/modify the response object and its parsed data.
	 *
	 * Returns the new Promise resolved `data` that will be returned to the client.
	 *
	 * Example:
	 * ```js
	 * client.afterSend = function (response, data) {
	 *     if (response.status != 200) {
	 *         throw new ClientResponseError({
	 *             url:      response.url,
	 *             status:   response.status,
	 *             data:     data,
	 *         });
	 *     }
	 *
	 *     return data;
	 * };
	 * ```
	 */
	afterSend?: (response: HttpResponseBase, data: any) => any;

	/**
	 * Optional language code (default to `en-US`) that will be sent
	 * with the requests to the server as `Accept-Language` header.
	 */
	public lang: string;

	/**
	 * A replaceable instance of the local auth store service.
	 */
	public authStore: BaseAuthStore;

	/**
	 * An instance of the service that handles the **Settings APIs**.
	 */
	readonly settings: SettingsService;

	/**
	 * An instance of the service that handles the **Admin APIs**.
	 */
	readonly admins: AdminService;

	/**
	 * An instance of the service that handles the **Collection APIs**.
	 */
	readonly collections: CollectionService;

	/**
	 * An instance of the service that handles the **File APIs**.
	 */
	readonly files: FileService;

	/**
	 * An instance of the service that handles the **Log APIs**.
	 */
	readonly logs: LogService;

	/**
	 * An instance of the service that handles the **Realtime APIs**.
	 */
	readonly realtime: RealtimeService;

	/**
	 * An instance of the service that handles the **Health APIs**.
	 */
	readonly health: HealthService;

	private cancelControllers: { [key: string]: AbortController } = {};
	private recordServices: { [key: string]: RecordService } = {};
	private enableAutoCancellation: boolean = true;

	constructor(
		private http: HttpClient,
		@Inject('POCKETBASE_CONFIG') pocketBaseConfig: PocketBaseConfig
	) {
		this.baseUrl = pocketBaseConfig.baseUrl;
		this.lang = pocketBaseConfig.lang || 'en-US';
		this.authStore = pocketBaseConfig.authStore || new LocalAuthStore();

		// services
		this.admins = new AdminService(this);
		this.collections = new CollectionService(this);
		this.files = new FileService(this);
		this.logs = new LogService(this);
		this.settings = new SettingsService(this);
		this.realtime = new RealtimeService(this);
		this.health = new HealthService(this);
	}

	/**
	 * Returns the RecordService associated to the specified collection.
	 *
	 * @param  {string} idOrName
	 * @return {RecordService}
	 */
	collection(idOrName: string): RecordService {
		if (!this.recordServices[idOrName]) {
			this.recordServices[idOrName] = new RecordService(this, idOrName);
		}

		return this.recordServices[idOrName];
	}

	/**
	 * Globally enable or disable auto cancellation for pending duplicated requests.
	 */
	autoCancellation(enable: boolean): void {
		this.enableAutoCancellation = !!enable;
	}

	/**
	 * Cancels single request by its cancellation key.
	 */
	cancelRequest(cancelKey: string): void {
		if (this.cancelControllers[cancelKey]) {
			this.cancelControllers[cancelKey].abort();
			delete this.cancelControllers[cancelKey];
		}
	}

	/**
	 * Cancels all pending requests.
	 */
	cancelAllRequests(): void {
		for (let k in this.cancelControllers) {
			this.cancelControllers[k].abort();
		}

		this.cancelControllers = {};
	}

	/**
	 * Sends an api http request.
	 */
	async send<T = any>(path: string, reqOptions: SendOptions): Promise<T> {
		let options = Object.assign({ method: 'GET' } as SendOptions, reqOptions);

		// JSON serialize the body if needed and set the correct content type
        // (for FormData body the Content-Type header should be skipped since the boundary is autogenerated)
        if (!this.isFormData(options.body)) {
			if (options.body && typeof options.body !== 'string') {
				options.body = JSON.stringify(options.body);
			}

			// add the json header (if not already)
            if (typeof options?.headers?.['Content-Type'] === 'undefined') {
				options.headers = Object.assign({}, options.headers, {
                    'Content-Type': 'application/json',
                });
			}
		}

		// add Accept-Language header (if not already)
        if (typeof options?.headers?.['Accept-Language'] === 'undefined') {
			options.headers = Object.assign({}, options.headers, {
                'Accept-Language': this.lang,
            });
		}

        // check if Authorization header can be added
		if (
            // has stored token
			this.authStore?.token &&
            // auth header is not explicitly set
			typeof options?.headers?.['Authorization'] === 'undefined'
		) {
			options.headers = Object.assign({}, options.headers, {
                'Authorization': this.authStore.token,
            });
		}

		// handle auto cancelation for duplicated pending request
        if (this.enableAutoCancellation && options.params?.$autoCancel !== false) {
			const cancelKey =
				options.params?.$cancelKey || (options.method || 'GET') + path;

			// cancel previous pending requests
            this.cancelRequest(cancelKey);

			const controller = new AbortController();
			this.cancelControllers[cancelKey] = controller;
			options.signal = controller.signal;
		}
		// remove the special cancellation params from the other valid query params
        delete options.params?.$autoCancel;
		delete options.params?.$cancelKey;

		let url = this.buildUrl(path);

		// serialize the query parameters
        if (typeof options.params !== 'undefined') {
			const query = this.serializeQueryParams(options.params);
			if (query) {
				url += (url.includes('?') ? '&' : '?') + query;
			}
			delete options.params;
		}

		if (this.beforeSend) {
			const result = Object.assign({}, await this.beforeSend(url, options));
			if (
				typeof result.url !== 'undefined' ||
				typeof result.options !== 'undefined'
			) {
				url = result.url || url;
				options = result.options || options;
			} else if (Object.keys(result).length) {
                // legacy behavior
				options = result as SendOptions;
				console?.warn &&
					console.warn(
						'Deprecated format of beforeSend return: please use `return { url, options }`, instead of `return options`.'
					);
			}
		}

        // send the request
		return lastValueFrom(
			this.http
				.request<T>(options.method as string, url, {
					body: options.body,
					headers: options.headers,
					observe: 'response',
					params: options.params,
					responseType: 'json',
					withCredentials: false
				})
				.pipe(
					map(async (response: HttpResponse<T> | undefined) => {
						let data: any = response?.body;

						if (this.afterSend) {
							data = await this.afterSend(response as HttpResponseBase, data);
						}

						if (response?.status && response.status >= 400) {
							throw new ClientResponseError({
								url: response.url,
								status: response.status,
								data: data
							});
						}

						return data as T;
					}),
					catchError((err: any, caught: Observable<Promise<any>>) => {
						// wrap to normalize all errors
						throw new ClientResponseError(err);
					})
				)
		);
	}

	/**
	 * Builds and returns an absolute record file url for the provided filename.
	 */
	getFileUrl(
		record: Pick<Record, 'id' | 'collectionId' | 'collectionName'>,
		filename: string,
		queryParams: FileQueryParams = {}
	): string {
		const parts = [];
		parts.push('api');
		parts.push('files');
		parts.push(encodeURIComponent(record.collectionId || record.collectionName));
		parts.push(encodeURIComponent(record.id));
		parts.push(encodeURIComponent(filename));

		let result = this.buildUrl(parts.join('/'));

		if (Object.keys(queryParams).length) {
			const params = new URLSearchParams(queryParams);
			result += (result.includes('?') ? '&' : '?') + params;
		}

		return result;
	}

	/**
     * Builds a full client url by safely concatenating the provided path.
     */
    buildUrl(path: string): string {
        let url = this.baseUrl;

        // construct an absolute base url if in a browser environment
        if (
            typeof window !== 'undefined' &&
            !!window.location &&
            !url.startsWith('https://') &&
            !url.startsWith('http://')
        ) {
            url = window.location.origin?.endsWith('/') ?
                window.location.origin.substring(0, window.location.origin.length - 1) :
                (window.location.origin || '');

            if (!this.baseUrl.startsWith('/')) {
                url += window.location.pathname || '/';
                url += url.endsWith('/') ? '' : '/';
            }

            url += this.baseUrl;
        }

        // concatenate the path
        if (path) {
            url += url.endsWith('/') ? '' : '/'; // append trailing slash if missing
            url += path.startsWith('/') ? path.substring(1) : path;
        }

        return url;
    }

	/**
	 * Loosely checks if the specified body is a FormData instance.
	 */
	private isFormData(body: any): boolean {
		return (
			body &&
			// we are checking the constructor name because FormData
			// is not available natively in some environments and the
			// polyfill(s) may not be globally accessible
			(body.constructor.name === 'FormData' ||
				// fallback to global FormData instance check
				// note: this is needed because the constructor.name could be different in case of
				//       custom global FormData implementation, eg. React Native on Android/iOS
				(typeof FormData !== 'undefined' && body instanceof FormData))
		);
	}

	/**
	 * Serializes the provided query parameters into a query string.
	 */
	private serializeQueryParams(params: { [key: string]: any }): string {
		const result: Array<string> = [];
		for (const key in params) {
			if (params[key] === null) {
				// skip null query params
				continue;
			}

			const value = params[key];
			const encodedKey = encodeURIComponent(key);

			if (Array.isArray(value)) {
				// "repeat" array params
				for (const v of value) {
					result.push(encodedKey + '=' + encodeURIComponent(v));
				}
			} else if (value instanceof Date) {
				result.push(encodedKey + '=' + encodeURIComponent(value.toISOString()));
			} else if (typeof value !== null && typeof value === 'object') {
				result.push(encodedKey + '=' + encodeURIComponent(JSON.stringify(value)));
			} else {
				result.push(encodedKey + '=' + encodeURIComponent(value));
			}
		}

		return result.join('&');
	}
}
