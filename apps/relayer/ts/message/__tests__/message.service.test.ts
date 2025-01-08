import { MessageService } from "../message.service";

import { defaultSaveMessagesArgs } from "./utils";

describe("MessageService", () => {
  test("should save messages properly", async () => {
    const service = new MessageService();

    const result = await service.saveMessages(defaultSaveMessagesArgs);

    expect(result).toBe(true);
  });

  test("should publish messages properly", async () => {
    const service = new MessageService();

    const result = await service.publishMessages(defaultSaveMessagesArgs);

    expect(result).toStrictEqual({ hash: "", ipfsHash: "" });
  });
});
