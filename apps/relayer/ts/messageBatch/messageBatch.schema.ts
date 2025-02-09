import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

import type { Message } from "../message/message.schema.js";

/**
 * Message batch document type
 */
export type MessageBatchDocument = HydratedDocument<MessageBatch>;

/**
 * Message batches limit
 */
export const MESSAGE_BATCHES_LIMIT = 1;

/**
 * Message batch model
 */
@Schema()
export class MessageBatch {
  /**
   * Messages
   */
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }], required: true })
  messages!: Message[];

  /**
   * IPFS hash
   */
  @Prop({ required: true })
  ipfsHash!: string;
}

/**
 * Message batch schema
 */
export const MessageBatchSchema = SchemaFactory.createForClass(MessageBatch);
