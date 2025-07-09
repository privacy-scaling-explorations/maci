import { Module } from "@nestjs/common";

import { FileModule } from "../file/file.module";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  imports: [FileModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
