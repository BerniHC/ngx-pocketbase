import { BaseModel } from './base-model';

export class Record extends BaseModel {
	collectionId!: string;
	collectionName!: string;
	expand!: { [key: string]: Record | Array<Record> };

	/**
	 * @inheritdoc
	 */
	override $load(data: { [key: string]: any }) {
		super.$load(data);

		// normalize common fields
		this.collectionId =
			typeof data['collectionId'] === 'string' ? data['collectionId'] : '';
		this.collectionName =
			typeof data['collectionName'] === 'string' ? data['collectionName'] : '';

		// normalize expand items
		this._loadExpand(data['expand']);
	}

	/**
	 * Loads the provided expand items and recursively normalizes each
	 * item to a `Record|Array<Record>`.
	 */
	private _loadExpand(expand: { [key: string]: any }) {
		expand = expand || {};
		this.expand = {};

		for (const key in expand) {
			if (Array.isArray(expand[key])) {
				this.expand[key] = expand[key].map((data: any) => new Record(data || {}));
			} else {
				this.expand[key] = new Record(expand[key] || {});
			}
		}
	}
}
