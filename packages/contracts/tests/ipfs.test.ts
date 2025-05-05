import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";

import { IpfsService } from "../ts/ipfs";

chai.use(chaiAsPromised);

const { expect } = chai;

describe("IpfsService", () => {
  let ipfsService: IpfsService;

  beforeEach(() => {
    ipfsService = IpfsService.getInstance();
  });

  it("should read data properly", async () => {
    const cid = "bafybeibro7fxpk7sk2nfvslumxraol437ug35qz4xx2p7ygjctunb2wi3i";
    const fetchSpy = sinon.spy(global, "fetch");
    await ipfsService.read(cid);

    expect(fetchSpy.calledWith(`https://ipfs.io/ipfs/${cid}`)).to.eq(true);
  });

  it("should return null if can't read data", async () => {
    const data = await ipfsService.read("invalid");

    expect(data).to.eq(null);
  });
});
