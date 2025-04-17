import { Keypair } from "@maci-protocol/domainobjs";
import { ZeroAddress } from "ethers";

import type { ICreateMessages } from "../types.js";

import { defaultMessageBatches } from "../../messageBatch/__tests__/utils.js";
import { PublishMessagesDto } from "../message.dto.js";

const keypair = new Keypair();

export const defaultMessages = defaultMessageBatches[0].messages;

export const defaultSaveMessagesDto = new PublishMessagesDto();
defaultSaveMessagesDto.maciContractAddress = ZeroAddress;
defaultSaveMessagesDto.poll = 0;
defaultSaveMessagesDto.messages = [
  {
    data: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    publicKey: keypair.publicKey.serialize(),
  },
];

export const defaultSaveMessagesArgs: ICreateMessages = {
  maciContractAddress: defaultSaveMessagesDto.maciContractAddress,
  poll: defaultSaveMessagesDto.poll,
  messages: [
    {
      data: defaultSaveMessagesDto.messages[0].data,
      hash: "0",
      publicKey: defaultSaveMessagesDto.messages[0].publicKey,
    },
  ],
};
