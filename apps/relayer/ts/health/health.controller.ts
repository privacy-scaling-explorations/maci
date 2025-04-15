/* eslint-disable @typescript-eslint/no-shadow */
import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("v1/health")
@Controller("v1/health")
export class HealthController {
  /**
   * Health check api method.
   *
   * @param args fetch arguments
   * @returns message batches
   */
  @ApiResponse({ status: HttpStatus.OK, description: "The service is running" })
  @Get("check")
  check(): boolean {
    return true;
  }
}
