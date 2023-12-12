import { expect } from "chai";
import { StateLeaf, Keypair } from "maci-domainobjs";

import { deployPoseidonContracts, linkPoseidonLibraries } from "../ts/deploy";
import { DomainObjs } from "../typechain-types";

describe("DomainObjs", () => {
  let doContract: DomainObjs;

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
      const doContractFactory = await linkPoseidonLibraries(
        "DomainObjs",
        poseidonT3ContractAddress,
        poseidonT4ContractAddress,
        poseidonT5ContractAddress,
        poseidonT6ContractAddress,
        true,
      );

      doContract = (await doContractFactory.deploy()) as typeof doContract;
      await doContract.deploymentTransaction()?.wait();
    });

    it("should correctly hash a StateLeaf", async () => {
      const keypair = new Keypair();
      const voiceCreditBalance = BigInt(1234);
      const stateLeaf = new StateLeaf(keypair.pubKey, voiceCreditBalance, BigInt(456546345));
      const onChainHash = await doContract.hashStateLeaf(stateLeaf.asContractParam());
      const expectedHash = stateLeaf.hash();

      expect(onChainHash.toString()).to.eq(expectedHash.toString());
    });
  });
});
