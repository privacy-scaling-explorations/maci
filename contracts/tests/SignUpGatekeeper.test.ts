import { expect } from "chai";
import { AbiCoder, ZeroAddress, Signer } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deploySignupToken, deploySignupTokenGatekeeper, deployFreeForAllSignUpGatekeeper } from "../ts/deploy";
import { getDefaultSigner } from "../ts/utils";
import { FreeForAllGatekeeper, MACI, SignUpToken, SignUpTokenGatekeeper } from "../typechain-types";

import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "./constants";
import { deployTestContracts } from "./utils";

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

      const r = await deployTestContracts(
        initialVoiceCreditBalance,
        STATE_TREE_DEPTH,
        signer,
        true,
        signUpTokenGatekeeperContract,
      );

      maciContract = r.maciContract;
    });

    it("sets MACI instance correctly", async () => {
      const maciAddress = await maciContract.getAddress();
      const tx = await signUpTokenGatekeeperContract.setMaciInstance(maciAddress);
      await tx.wait();

      expect(await signUpTokenGatekeeperContract.maci()).to.eq(maciAddress);
    });

    it("it should revert if the register function is called by a non registered maci instance", async () => {
      const user = new Keypair();

      await signUpToken.giveToken(await signer.getAddress(), 0);

      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        ),
      ).to.be.revertedWithCustomError(signUpTokenGatekeeperContract, "OnlyMACI");
    });

    it("should register a user if the register function is called by a registered maci instance", async () => {
      const user = new Keypair();

      await signUpToken.giveToken(await signer.getAddress(), 0);

      await signUpTokenGatekeeperContract.setMaciInstance(await maciContract.getAddress());

      const tx = await maciContract.signUp(
        user.pubKey.asContractParam(),
        AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
        AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
      );
      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);
    });
  });

  describe("FreeForAllSignUpGatekeeper", () => {
    it("should always complete successfully", async () => {
      const tx = await freeForAllContract.register(ZeroAddress, AbiCoder.defaultAbiCoder().encode(["uint256"], [1]));
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });
  });
});
