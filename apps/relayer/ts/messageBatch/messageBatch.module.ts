import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { IpfsModule } from "../ipfs/ipfs.module.js";

import { MessageBatchController } from "./messageBatch.controller.js";
import { MessageBatchRepository } from "./messageBatch.repository.js";
import { MessageBatch, MessageBatchSchema } from "./messageBatch.schema.js";
import { MessageBatchService } from "./messageBatch.service.js";

@Module({
  imports: [MongooseModule.forFeature([{ name: MessageBatch.name, schema: MessageBatchSchema }]), IpfsModule],
  exports: [MessageBatchService],
  controllers: [MessageBatchController],
  providers: [MessageBatchService, MessageBatchRepository],
})
export class MessageBatchModule {}
