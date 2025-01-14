import { IpfsService } from "../ipfs.service";

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
});
