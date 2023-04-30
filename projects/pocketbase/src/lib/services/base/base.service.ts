import { PocketBaseService } from '../pocketbase/pocketbase.service';

export abstract class BaseService {
  readonly client: PocketBaseService;

	constructor(public pocketbase: PocketBaseService) {
		this.client = pocketbase;
	}
}
