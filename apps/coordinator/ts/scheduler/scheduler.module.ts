import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { RedisModule } from "../redis/redis.module";
import { SessionKeysModule } from "../sessionKeys/sessionKeys.module";

import { SchedulerController } from "./scheduler.controller";
import { SchedulerService } from "./scheduler.service";

@Module({
  imports: [SessionKeysModule, RedisModule, ScheduleModule.forRoot()],
  providers: [SchedulerService],
  controllers: [SchedulerController],
})
export class SchedulerModule {}
