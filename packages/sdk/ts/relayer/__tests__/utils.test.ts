import { type IIpfsMessage, IpfsService } from "@maci-protocol/contracts";
import { Keypair } from "@maci-protocol/domainobjs";
import { ZeroAddress, type Provider } from "ethers";

import type { Poll } from "@maci-protocol/contracts/typechain-types";

import { parseIpfsHashAddedEvents } from "../utils";

describe("utils", () => {
  let mockPollContract: Poll;
  let mockIpfsService: IpfsService;

  const mockProvider = {
    getBlockNumber: () => Promise.resolve(0),
  } as Provider;

  const keypair = new Keypair();

  const defaultMessages: IIpfsMessage[] = [
    {
      publicKey: keypair.publicKey.asArray().map(String) as [string, string],
      data: new Array(10).fill("0") as string[],
      hash: "hash1",
      maciAddress: ZeroAddress,
      poll: 0,
    },
    {
      publicKey: new Keypair().publicKey.asArray().map(String) as [string, string],
      data: new Array(10).fill("0") as string[],
      hash: "hash2",
      maciAddress: ZeroAddress,
      poll: 0,
    },
  ];

  beforeEach(() => {
    mockIpfsService = {
      read: jest.fn().mockResolvedValue(defaultMessages),
    } as unknown as IpfsService;
    jest.spyOn(IpfsService, "getInstance").mockReturnValue(mockIpfsService);

    mockPollContract = {
      queryFilter: jest.fn().mockResolvedValue([{ args: { _ipfsHash: "hash" } }]),
      filters: {
        IpfsHashAdded: jest.fn(),
      },
    } as unknown as Poll;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should parse IpfsHashAdded events properly", async () => {
    const { messages } = await parseIpfsHashAddedEvents({
      startBlock: 0,
      provider: mockProvider,
      pollContract: mockPollContract,
      publicKeys: [keypair.publicKey.serialize()],
      messageHashes: ["hash1"],
    });

    expect(messages).toStrictEqual([defaultMessages[0]]);
  });

  it("should parse IpfsHashAdded events properly without public keys and message hashes", async () => {
    const { messages } = await parseIpfsHashAddedEvents({
      startBlock: 0,
      provider: mockProvider,
      pollContract: mockPollContract,
    });

    expect(messages).toStrictEqual(defaultMessages);
  });

  it("should return empty array if can't get messages from ipfs", async () => {
    mockIpfsService.read = jest.fn().mockResolvedValue(null);

    const { messages } = await parseIpfsHashAddedEvents({
      startBlock: 0,
      provider: mockProvider,
      pollContract: mockPollContract,
    });

    expect(messages).toHaveLength(0);
  });
});
