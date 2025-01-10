import { ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { defaultMessageBatches } from "../../messageBatch/__tests__/utils";
import { PublishMessagesDto } from "../dto";

const keypair = new Keypair();

export const defaultMessages = defaultMessageBatches[0].messages;

export const defaultSaveMessagesArgs = new PublishMessagesDto();
defaultSaveMessagesArgs.maciContractAddress = ZeroAddress;
defaultSaveMessagesArgs.poll = 0;
defaultSaveMessagesArgs.messages = [
  {
    data: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    publicKey: keypair.pubKey.serialize(),
  },
];
