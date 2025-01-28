import { ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { MessageBatchDto } from "../messageBatch.dto";

const keypair = new Keypair();

export const defaultIpfsHash = "QmXj8v1qbwTqVp9RxkQR29Xjc6g5C1KL2m2gZ9b8t8THHj";

const defaultMessageBatch = new MessageBatchDto();
defaultMessageBatch.messages = [
  {
    publicKey: keypair.pubKey.serialize(),
    data: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    maciContractAddress: ZeroAddress,
    poll: 0,
  },
];
defaultMessageBatch.ipfsHash = defaultIpfsHash;

export const defaultMessageBatches: MessageBatchDto[] = [defaultMessageBatch];
