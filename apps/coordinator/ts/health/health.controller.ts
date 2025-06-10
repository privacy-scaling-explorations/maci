import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { HealthService } from "./health.service";
import { IHealthCheckResponse } from "./types";

@ApiTags("v1/health")
@Controller("v1/health")
export class HealthController {
  /**
   * Initialize HealthController
   */
  constructor(private readonly healthService: HealthService) {}

  /**
   * Health check api method.
   *
   * @returns true if the service is running
   */
  @ApiResponse({ status: HttpStatus.OK, description: "The service is running" })
  @Get("check")
  check(): Promise<IHealthCheckResponse> {
    return this.healthService.checkCoordinatorHealth();
  }
}
