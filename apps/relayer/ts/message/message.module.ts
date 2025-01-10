import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MessageBatchModule } from "../messageBatch/messageBatch.module";

import { MessageController } from "./message.controller";
import { MessageRepository } from "./message.repository";
import { Message, MessageSchema } from "./message.schema";
import { MessageService } from "./message.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]), MessageBatchModule],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository],
})
export class MessageModule {}
