import { Keypair } from "@maci-protocol/domainobjs";
import { ZeroAddress } from "ethers";

import { Message } from "../../message/message.schema.js";
import { GetMessageBatchesDto, MAX_MESSAGES, MessageBatchDto } from "../messageBatch.dto.js";

const keypair = new Keypair();

export const defaultIpfsHash = "QmXj8v1qbwTqVp9RxkQR29Xjc6g5C1KL2m2gZ9b8t8THHj";

const defaultMessageBatch = new MessageBatchDto();
const defaultMessage = new Message();
defaultMessage.data = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
defaultMessage.hash = "0";
defaultMessage.publicKey = keypair.pubKey.serialize();
defaultMessage.maciContractAddress = ZeroAddress;
defaultMessage.poll = 0;
defaultMessageBatch.messages = [defaultMessage];
defaultMessageBatch.ipfsHash = defaultIpfsHash;

export const defaultMessageBatches: MessageBatchDto[] = [defaultMessageBatch];

export const defaultGetMessageBatchesDto = new GetMessageBatchesDto();
defaultGetMessageBatchesDto.limit = MAX_MESSAGES;
defaultGetMessageBatchesDto.maciContractAddress = ZeroAddress;
defaultGetMessageBatchesDto.poll = 0;
defaultGetMessageBatchesDto.ipfsHashes = [defaultIpfsHash];
defaultGetMessageBatchesDto.messageHashes = ["0"];
defaultGetMessageBatchesDto.publicKeys = [keypair.pubKey.serialize()];
