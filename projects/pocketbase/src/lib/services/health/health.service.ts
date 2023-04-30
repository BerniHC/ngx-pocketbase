import { BaseQueryParams } from "../../models/query-params";
import { BaseService } from "../base/base.service";

export interface healthCheckResponse {
  code:    number;
  message: string;
}

export class HealthService extends BaseService {
  /**
   * Checks the health status of the api.
   */
  check(queryParams: BaseQueryParams = {}): Promise<healthCheckResponse> {
      return this.client.send('/api/health', {
          'method': 'GET',
          'params': queryParams,
      });
  }
}
