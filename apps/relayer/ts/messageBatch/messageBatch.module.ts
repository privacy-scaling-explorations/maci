import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { IpfsModule } from "../ipfs/ipfs.module";

import { MessageBatchRepository } from "./messageBatch.repository";
import { MessageBatch, MessageBatchSchema } from "./messageBatch.schema";
import { MessageBatchService } from "./messageBatch.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: MessageBatch.name, schema: MessageBatchSchema }]), IpfsModule],
  exports: [MessageBatchService],
  providers: [MessageBatchService, MessageBatchRepository],
})
export class MessageBatchModule {}
