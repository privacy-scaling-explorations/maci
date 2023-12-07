import { expect } from "chai";
import { AbiCoder, BigNumberish } from "ethers";
import { Keypair } from "maci-domainobjs";

import {
  getDefaultSigner,
  deploySignupToken,
  deploySignupTokenGatekeeper,
  deployFreeForAllSignUpGatekeeper,
} from "../ts/deploy";
import { deployTestContracts } from "../ts/utils";
import { FreeForAllGatekeeper, MACI, SignUpToken, SignUpTokenGatekeeper } from "../typechain-types";

const initialVoiceCreditBalance = 100;
const STATE_TREE_DEPTH = 10;

describe("SignUpGatekeeper", () => {
  let signUpToken: SignUpToken;
  let freeForAllContract: FreeForAllGatekeeper;
  let signUpTokenGatekeeperContract: SignUpTokenGatekeeper;

  before(async () => {
    freeForAllContract = await deployFreeForAllSignUpGatekeeper(true);
    signUpToken = await deploySignupToken(true);
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
      freeForAllContract = await deployFreeForAllSignUpGatekeeper(true);
      signUpToken = await deploySignupToken(true);
      signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(await signUpToken.getAddress(), true);

      const r = await deployTestContracts(
        initialVoiceCreditBalance,
        STATE_TREE_DEPTH,
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
      const signer = await getDefaultSigner();

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
