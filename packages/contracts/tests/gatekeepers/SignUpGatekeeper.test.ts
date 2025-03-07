import { expect } from "chai";
import { AbiCoder, ZeroAddress, Signer } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deploySignupToken, deploySignupTokenGatekeeper, deployFreeForAllSignUpGatekeeper } from "../../ts/deploy";
import { getDefaultSigner } from "../../ts/utils";
import { FreeForAllGatekeeper, MACI, SignUpToken, SignUpTokenGatekeeper } from "../../typechain-types";
import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "../constants";
import { deployTestContracts } from "../utils";

describe("SignUpGatekeeper", () => {
  let signUpToken: SignUpToken;
  let freeForAllContract: FreeForAllGatekeeper;
  let signUpTokenGatekeeperContract: SignUpTokenGatekeeper;
  let signer: Signer;

  before(async () => {
    signer = await getDefaultSigner();
    freeForAllContract = await deployFreeForAllSignUpGatekeeper(signer, true);
    signUpToken = await deploySignupToken(signer, true);
    signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(await signUpToken.getAddress(), signer, true);
  });

  describe("Deployment", () => {
    it("Gatekeepers should be deployed correctly", () => {
      expect(freeForAllContract).to.not.eq(undefined);
      expect(signUpToken).to.not.eq(undefined);
      expect(signUpTokenGatekeeperContract).to.not.eq(undefined);
    });

    it("SignUpTokenGatekeeper has token address set", async () => {
      expect(await signUpTokenGatekeeperContract.token()).to.eq(await signUpToken.getAddress());
    });
  });

  describe("SignUpTokenGatekeeper", () => {
    let maciContract: MACI;

    beforeEach(async () => {
      signUpToken = await deploySignupToken(signer, true);
      signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(await signUpToken.getAddress(), signer, true);

      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
        gatekeeper: signUpTokenGatekeeperContract,
      });

      maciContract = r.maciContract;
    });

    it("should set guarded target correctly", async () => {
      const maciAddress = await maciContract.getAddress();
      await signUpTokenGatekeeperContract.setTarget(maciAddress).then((tx) => tx.wait());

      expect(await signUpTokenGatekeeperContract.guarded()).to.eq(maciAddress);
    });

    it("it should revert if the register function is called by a non registered maci instance", async () => {
      const user = new Keypair();

      await signUpToken.giveToken(await signer.getAddress(), 0);

      await expect(
        maciContract.signUp(user.pubKey.asContractParam(), AbiCoder.defaultAbiCoder().encode(["uint256"], [1])),
      ).to.be.revertedWithCustomError(signUpTokenGatekeeperContract, "TargetOnly");
    });

    it("should register a user if the register function is called by a registered maci instance", async () => {
      const user = new Keypair();

      await signUpToken.giveToken(await signer.getAddress(), 0);

      const maciAddress = await maciContract.getAddress();
      await signUpTokenGatekeeperContract.setTarget(maciAddress).then((tx) => tx.wait());

      const tx = await maciContract.signUp(
        user.pubKey.asContractParam(),
        AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
      );
      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);
    });
  });

  describe("FreeForAllGatekeeper", () => {
    it("should always complete successfully", async () => {
      await freeForAllContract.setTarget(await signer.getAddress()).then((tx) => tx.wait());

      const tx = await freeForAllContract.enforce(ZeroAddress, AbiCoder.defaultAbiCoder().encode(["uint256"], [1]));
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });
  });
});
