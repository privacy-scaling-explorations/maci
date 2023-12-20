import { expect } from "chai";
import { AbiCoder, BigNumberish, Signer } from "ethers";
import { STATE_TREE_DEPTH } from "maci-core";
import { Keypair } from "maci-domainobjs";

import { deploySignupToken, deploySignupTokenGatekeeper, deployFreeForAllSignUpGatekeeper } from "../ts/deploy";
import { getDefaultSigner } from "../ts/utils";
import { FreeForAllGatekeeper, MACI, SignUpToken, SignUpTokenGatekeeper } from "../typechain-types";

import { initialVoiceCreditBalance } from "./constants";
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
    signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(await signUpToken.getAddress());
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
      freeForAllContract = await deployFreeForAllSignUpGatekeeper(signer, true);
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

    it("Reverts if address provided is not a MACI instance", async () => {
      const user = new Keypair();

      const tx = await signUpToken.giveToken(await signer.getAddress(), 0);
      await tx.wait();

      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam() as { x: BigNumberish; y: BigNumberish },
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [0]),
          { gasLimit: 300000 },
        ),
      ).to.be.revertedWithCustomError(signUpTokenGatekeeperContract, "OnlyMACI");
    });
  });
});
