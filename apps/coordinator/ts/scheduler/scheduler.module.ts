import { Module } from "@nestjs/common";

import { RedisModule } from "../redis/redis.module";
import { SessionKeysModule } from "../sessionKeys/sessionKeys.module";

import { SchedulerService } from "./scheduler.service";

@Module({
  imports: [SessionKeysModule, RedisModule],
  exports: [SchedulerService],
  providers: [SchedulerService],
})
export class SchedulerModule {}
