import { Module } from "@nestjs/common";

import { ProofModule } from "../proof/proof.module";
import { RedisModule } from "../redis/redis.module";
import { SessionKeysModule } from "../sessionKeys/sessionKeys.module";

import { SchedulerController } from "./scheduler.controller";
import { SchedulerService } from "./scheduler.service";

@Module({
  controllers: [SchedulerController],
  imports: [SessionKeysModule, ProofModule, RedisModule],
  exports: [SchedulerService],
  providers: [SchedulerService],
})
export class SchedulerModule {}
