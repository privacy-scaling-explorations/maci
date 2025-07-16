import { Module } from "@nestjs/common";

import { FileModule } from "../file/file.module";
import { RedisModule } from "../redis/redis.module";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  imports: [FileModule, RedisModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
