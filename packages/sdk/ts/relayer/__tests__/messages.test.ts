import { Keypair } from "@maci-protocol/domainobjs";
import { type Provider, type Signer, ZeroAddress } from "ethers";

import type { IIpfsMessage } from "@maci-protocol/contracts";

import {
  getRelayedMessages,
  getMessageBatches,
  type IGetRelayedMessagesArgs,
  type IGetMessageBatchesArgs,
  type IMessageBatch,
} from "..";
import { getPollContracts } from "../../poll/utils";
import { parseIpfsHashAddedEvents } from "../utils";

jest.mock("../../poll/utils", (): unknown => ({
  getPollContracts: jest.fn(),
}));

jest.mock("../utils", (): unknown => ({
  parseIpfsHashAddedEvents: jest.fn(),
}));

describe("messages", () => {
  const keypair = new Keypair();

  const defaultMessages: IIpfsMessage[] = [
    {
      publicKey: keypair.publicKey.asArray().map(String) as [string, string],
      data: new Array(10).fill("0") as string[],
      hash: "hash",
      maciAddress: ZeroAddress,
      poll: 0,
    },
  ];

  describe("getRelayedMessages", () => {
    const defaultArgs: IGetRelayedMessagesArgs = {
      maciAddress: ZeroAddress,
      pollId: 0,
      signer: {} as Signer,
      provider: {} as Provider,
    };

    beforeEach(() => {
      (getPollContracts as jest.Mock).mockResolvedValue({ poll: {} });

      (parseIpfsHashAddedEvents as jest.Mock).mockResolvedValue({ messages: defaultMessages });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should get relayed messages properly", async () => {
      const { messages } = await getRelayedMessages(defaultArgs);

      expect(messages).toStrictEqual(defaultMessages);
    });
  });

  describe("getMessageBatches", () => {
    const defaultArgs: IGetMessageBatchesArgs = {
      maciContractAddress: ZeroAddress,
      poll: 0,
      url: "url",
      limit: 10,
      skip: 0,
      ipfsHashes: ["hash"],
      publicKeys: ["key"],
      messageHashes: ["hash"],
    };

    const defaultMessageBatches: IMessageBatch[] = [
      {
        messages: defaultMessages,
        ipfsHash: "hash",
      },
    ];

    beforeEach(() => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        json: jest.fn().mockResolvedValue(defaultMessageBatches),
      } as unknown as Response);
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    test("should get message batches properly", async () => {
      const { messageBatches } = await getMessageBatches(defaultArgs);

      expect(messageBatches).toStrictEqual(defaultMessageBatches);
    });
  });
});
