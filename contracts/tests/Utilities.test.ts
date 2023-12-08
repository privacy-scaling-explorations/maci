import { expect } from "chai";
import { StateLeaf, Keypair } from "maci-domainobjs";

import { deployPoseidonContracts, linkPoseidonLibraries } from "../ts/deploy";
import { Utilities } from "../typechain-types";

describe("DomainObjs", () => {
  let utilitiesContract: Utilities;

  describe("Deployment", () => {
    before(async () => {
      const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
        await deployPoseidonContracts(true);

      const [
        poseidonT3ContractAddress,
        poseidonT4ContractAddress,
        poseidonT5ContractAddress,
        poseidonT6ContractAddress,
      ] = await Promise.all([
        PoseidonT3Contract.getAddress(),
        PoseidonT4Contract.getAddress(),
        PoseidonT5Contract.getAddress(),
        PoseidonT6Contract.getAddress(),
      ]);

      // Link Poseidon contracts
      const utilitiesContractFactory = await linkPoseidonLibraries(
        "Utilities",
        poseidonT3ContractAddress,
        poseidonT4ContractAddress,
        poseidonT5ContractAddress,
        poseidonT6ContractAddress,
        true,
      );

      utilitiesContract = (await utilitiesContractFactory.deploy()) as Utilities;
      await utilitiesContract.deploymentTransaction()?.wait();
    });

    it("should correctly hash a StateLeaf", async () => {
      const keypair = new Keypair();
      const voiceCreditBalance = BigInt(1234);
      const stateLeaf = new StateLeaf(keypair.pubKey, voiceCreditBalance, BigInt(456546345));
      const onChainHash = await utilitiesContract.hashStateLeaf(stateLeaf.asContractParam());
      const expectedHash = stateLeaf.hash();

      expect(onChainHash.toString()).to.eq(expectedHash.toString());
    });
  });
});
