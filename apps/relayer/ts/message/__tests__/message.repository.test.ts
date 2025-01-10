import { ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";
import { Model } from "mongoose";

import { MessageRepository } from "../message.repository";
import { Message } from "../message.schema";

import { defaultSaveMessagesArgs } from "./utils";

describe("MessageRepository", () => {
  const defaultMessages: Message[] = [
    {
      publicKey: new Keypair().pubKey.serialize(),
      data: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      maciContractAddress: ZeroAddress,
      poll: 0,
    },
  ];

  const mockMessageModel = {
    find: jest
      .fn()
      .mockReturnValue({ limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(defaultMessages) }) }),
    insertMany: jest.fn().mockResolvedValue(defaultMessages),
  } as unknown as Model<Message>;

  beforeEach(() => {
    mockMessageModel.find = jest
      .fn()
      .mockReturnValue({ limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(defaultMessages) }) });
    mockMessageModel.insertMany = jest.fn().mockResolvedValue(defaultMessages);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should create messages properly", async () => {
    const repository = new MessageRepository(mockMessageModel);

    const result = await repository.create(defaultSaveMessagesArgs);

    expect(result).toStrictEqual(defaultMessages);
  });

  test("should throw an error if creation is failed", async () => {
    const error = new Error("error");

    (mockMessageModel.insertMany as jest.Mock).mockRejectedValue(error);

    const repository = new MessageRepository(mockMessageModel);

    await expect(repository.create(defaultSaveMessagesArgs)).rejects.toThrow(error);
  });

  test("should find messages properly", async () => {
    const repository = new MessageRepository(mockMessageModel);

    const result = await repository.find({});

    expect(result).toStrictEqual(defaultMessages);
  });

  test("should throw an error if find is failed", async () => {
    const error = new Error("error");

    (mockMessageModel.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(error),
      }),
    });

    const repository = new MessageRepository(mockMessageModel);

    await expect(repository.find({})).rejects.toThrow(error);
  });
});
