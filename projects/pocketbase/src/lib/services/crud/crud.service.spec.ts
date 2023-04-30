import { TestBed } from '@angular/core/testing';

import { CrudService } from './crud.service';
import { BaseModel } from '../../models/base-model';

describe('CrudService', () => {
	let service: CrudService<BaseModel>;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(CrudService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
