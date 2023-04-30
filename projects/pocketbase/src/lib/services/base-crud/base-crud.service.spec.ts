import { TestBed } from '@angular/core/testing';

import { BaseCrudService } from './base-crud.service';
import { BaseModel } from '../../models/base-model';

describe('BaseCrudService', () => {
	let service: BaseCrudService<BaseModel>;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(BaseCrudService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
