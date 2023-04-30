import { ModuleWithProviders, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BaseAuthStore } from './stores/base-auth-store';
import { PocketBaseService } from './services/pocketbase/pocketbase.service';

@NgModule({
	declarations: [],
	imports: [HttpClientModule],
	exports: []
})
export class PocketBaseModule {

	static init(config: PocketBaseConfig): ModuleWithProviders<PocketBaseModule> {
		return {
			ngModule: PocketBaseModule,
			providers: [
				PocketBaseService,
				{ provide: 'POCKETBASE_CONFIG', useValue: config }
			]
		}
	}
}

export interface PocketBaseConfig {
	baseUrl: string;
	authStore?: BaseAuthStore | null;
	lang?: string | null;
}