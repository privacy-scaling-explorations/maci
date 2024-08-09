import { expect } from "chai";
import { encodeBytes32String, Signer } from "ethers";

import { deployContract, getSigners } from "../../ts";
import { SimpleProjectRegistry } from "../../typechain-types";

describe("SimpleProjecttRegistry", () => {
  let projectRegistry: SimpleProjectRegistry;
  let owner: Signer;
  let user: Signer;

  let ownerAddress: string;
  let userAddress: string;

  const metadataUrl = encodeBytes32String("url");

  before(async () => {
    [owner, user] = await getSigners();
    [ownerAddress, userAddress] = await Promise.all([owner.getAddress(), user.getAddress()]);
    projectRegistry = await deployContract("SimpleProjectRegistry", owner, true, metadataUrl);
  });

  it("should allow the owner to add a project", async () => {
    await projectRegistry.addProject({ project: ownerAddress, metadataUrl });
  });

  it("should allow the owner to add multiple projects", async () => {
    await projectRegistry.addProjects([
      { project: ownerAddress, metadataUrl },
      { project: userAddress, metadataUrl },
      { project: ownerAddress, metadataUrl },
    ]);
  });

  it("should throw if the caller is not the owner", async () => {
    await expect(
      projectRegistry.connect(user).addProject({ project: ownerAddress, metadataUrl }),
    ).to.be.revertedWithCustomError(projectRegistry, "OwnableUnauthorizedAccount");
  });

  it("should return registry metadata url properly", async () => {
    const url = await projectRegistry.getRegistryMetadataUrl();

    expect(url).to.equal(metadataUrl);
  });

  it("should return the correct address given an index", async () => {
    const data = await projectRegistry.getProject(0n);

    expect(data.project).to.equal(ownerAddress);
    expect(data.metadataUrl).to.equal(metadataUrl);
  });

  it("should return the full list of addresses", async () => {
    const projects = await projectRegistry.getProjects();
    const data = projects.map((item) => ({ project: item.project, metadataUrl: item.metadataUrl }));

    expect(data).to.deep.equal([
      { project: ownerAddress, metadataUrl },
      { project: ownerAddress, metadataUrl },
      { project: userAddress, metadataUrl },
      { project: ownerAddress, metadataUrl },
    ]);
  });
});
