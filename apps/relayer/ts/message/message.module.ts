import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MessageBatchModule } from "../messageBatch/messageBatch.module.js";

import { MessageController } from "./message.controller.js";
import { MessageRepository } from "./message.repository.js";
import { Message, MessageSchema } from "./message.schema.js";
import { MessageService } from "./message.service.js";

@Module({
  imports: [MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]), MessageBatchModule],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository],
})
export class MessageModule {}
