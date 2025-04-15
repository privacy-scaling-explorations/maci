import { IpfsService } from "../ipfs.service.js";

describe("IpfsService", () => {
  const defaultData = { hello: "world" };

  test("should not add or get data if adapter is not initialized", async () => {
    const service = new IpfsService();

    await expect(service.add(defaultData)).rejects.toThrow("IPFS adapter is not initialized");
    await expect(service.get("cid")).rejects.toThrow("IPFS adapter is not initialized");
  });

  test("should add data and get data properly", async () => {
    const service = new IpfsService();
    await service.init();

    const cid = await service.add(defaultData);
    const data = await service.get(cid);

    expect(data).toStrictEqual(defaultData);
  });

  test("should convert cid v1 to bytes32 properly", async () => {
    const service = new IpfsService();
    await service.init();

    const bytes32Id = await service.cidToBytes32("bagaaierae7uwukkhfsvbw63l2wc4jdi2pilwaceei5quutzi4vcuh2z72dcq");

    expect(bytes32Id).toBe("0x27e96a29472caa1b7b6bd585c48d1a7a1760088447614a4f28e54543eb3fd0c5");
  });
});
