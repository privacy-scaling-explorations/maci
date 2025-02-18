import { ZeroAddress, type Provider } from "ethers";
import { type IIpfsMessage, IpfsService } from "maci-contracts";
import { Keypair } from "maci-domainobjs";

import type { Poll } from "maci-contracts/typechain-types";

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
      publicKey: keypair.pubKey.asArray().map(String) as [string, string],
      data: new Array(10).fill("0") as string[],
      hash: "hash1",
      maciContractAddress: ZeroAddress,
      poll: 0,
    },
    {
      publicKey: new Keypair().pubKey.asArray().map(String) as [string, string],
      data: new Array(10).fill("0") as string[],
      hash: "hash2",
      maciContractAddress: ZeroAddress,
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
      publicKeys: [keypair.pubKey.serialize()],
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
