import { BaseModel } from './base-model';

export class Admin extends BaseModel {
	avatar!: number;
	email!: string;

	/**
	 * @inheritdoc
	 */
	override $load(data: { [key: string]: any }) {
		super.$load(data);

		this.avatar = typeof data['avatar'] === 'number' ? data['avatar'] : 0;
		this.email = typeof data['email'] === 'string' ? data['email'] : '';
	}
}
