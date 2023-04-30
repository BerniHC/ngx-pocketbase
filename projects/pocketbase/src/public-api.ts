/*
 * Public API Surface of pocketbase
 */

// models
export * from './lib/models/admin';
export * from './lib/models/base-model';
export * from './lib/models/client-response-error';
export * from './lib/models/collection';
export * from './lib/models/external-auth';
export * from './lib/models/list-result';
export * from './lib/models/log-request';
export * from './lib/models/query-params'
export * from './lib/models/record';
export * from './lib/models/schema-field';

// services
export * from './lib/services/admin/admin.service';
export * from './lib/services/base/base.service';
export * from './lib/services/base-crud/base-crud.service';
export * from './lib/services/collection/collection.service';
export * from './lib/services/crud/crud.service';
export * from './lib/services/file/file.service';
export * from './lib/services/health/health.service';
export * from './lib/services/log/log.service';
export * from './lib/services/pocketbase/pocketbase.service';
export * from './lib/services/realtime/realtime.service';
export * from './lib/services/record/record.service';
export * from './lib/services/settings/settings.service';

// stores
export * from './lib/stores/base-auth-store';
export * from './lib/stores/local-auth-store';

// module
export * from './lib/pocketbase.module';
