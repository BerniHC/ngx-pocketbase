import { CrudService } from '../crud/crud.service';
import { BaseQueryParams } from '../../models/query-params';
import { Collection } from '../../models/collection';

export class CollectionService extends CrudService<Collection> {
	/**
	 * @inheritdoc
	 */
	decode(data: { [key: string]: any }): Collection {
		return new Collection(data);
	}

	/**
	 * @inheritdoc
	 */
	get baseCrudPath(): string {
		return '/api/collections';
	}

	/**
	 * Imports the provided collections.
	 *
	 * If `deleteMissing` is `true`, all local collections and schema fields,
	 * that are not present in the imported configuration, WILL BE DELETED
	 * (including their related records data)!
	 */
	async import(
		collections: Array<Collection>,
		deleteMissing: boolean = false,
		queryParams: BaseQueryParams = {}
	): Promise<true> {
		return this.client
			.send(this.baseCrudPath + '/import', {
				method: 'PUT',
				params: queryParams,
				body: {
					collections: collections,
					deleteMissing: deleteMissing
				}
			})
			.then(() => true);
	}
}
