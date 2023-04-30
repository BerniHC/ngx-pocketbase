import { BaseModel } from './base-model';

export class ExternalAuth extends BaseModel {
	recordId!: string;
	collectionId!: string;
	provider!: string;
	providerId!: string;

	/**
	 * @inheritdoc
	 */
	override $load(data: { [key: string]: any }) {
		super.$load(data);

		this.recordId = typeof data['recordId'] === 'string' ? data['recordId'] : '';
		this.collectionId =
			typeof data['collectionId'] === 'string' ? data['collectionId'] : '';
		this.provider = typeof data['provider'] === 'string' ? data['provider'] : '';
		this.providerId =
			typeof data['providerId'] === 'string' ? data['providerId'] : '';
	}
}
