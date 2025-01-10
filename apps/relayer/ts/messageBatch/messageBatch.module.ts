import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MessageBatchRepository } from "./messageBatch.repository";
import { MessageBatch, MessageBatchSchema } from "./messageBatch.schema";
import { MessageBatchService } from "./messageBatch.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: MessageBatch.name, schema: MessageBatchSchema }])],
  exports: [MessageBatchService],
  providers: [MessageBatchService, MessageBatchRepository],
})
export class MessageBatchModule {}
