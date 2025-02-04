import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

import type { MessageBatch } from "../messageBatch/messageBatch.schema";

/**
 * Message document type
 */
export type MessageDocument = HydratedDocument<Message>;

/**
 * Messages limit
 */
export const MESSAGES_LIMIT = 100;

/**
 * Message model
 */
@Schema()
export class Message {
  /**
   * Public key
   */
  @Prop({ required: true })
  publicKey!: string;

  /**
   * Message data
   */
  @Prop({ required: true })
  data!: string[];

  /**
   * Message hash
   */
  @Prop({ required: true })
  hash!: string;

  /**
   * MACI contract address
   */
  @Prop({ required: true })
  maciContractAddress!: string;

  /**
   * Poll ID
   */
  @Prop({ required: true })
  poll!: number;

  /**
   * Message batch
   */
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false })
  messageBatch?: MessageBatch;
}

/**
 * Message schema
 */
export const MessageSchema = SchemaFactory.createForClass(Message);
