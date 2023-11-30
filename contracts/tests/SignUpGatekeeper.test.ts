import {
  getDefaultSigner,
  deploySignupToken,
  deploySignupTokenGatekeeper,
  deployFreeForAllSignUpGatekeeper,
} from "../ts/deploy";
import { deployTestContracts } from "../ts/utils";
import { Keypair } from "maci-domainobjs";
import { expect } from "chai";
import { utils } from "ethers";

const initialVoiceCreditBalance = 100;
const STATE_TREE_DEPTH = 10;

describe("SignUpGatekeeper", () => {
  let signUpToken;
  let freeForAllContract;
  let signUpTokenGatekeeperContract;

  before(async () => {
    freeForAllContract = await deployFreeForAllSignUpGatekeeper(true);
    signUpToken = await deploySignupToken(true);
    signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(await signUpToken.address);
  });

  describe("Deployment", () => {
    it("Gatekeepers should be deployed correctly", async () => {
      expect(freeForAllContract).to.not.be.undefined;
      expect(signUpToken).to.not.be.undefined;
      expect(signUpTokenGatekeeperContract).to.not.be.undefined;
    });

    it("SignUpTokenGatekeeper has token address set", async () => {
      expect(await signUpTokenGatekeeperContract.token()).to.eq(await signUpToken.address);
    });
  });

  describe("SignUpTokenGatekeeper", () => {
    let maciContract: any;
    beforeEach(async () => {
      freeForAllContract = await deployFreeForAllSignUpGatekeeper(true);
      signUpToken = await deploySignupToken(true);
      signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(await signUpToken.address, true);
      const r = await deployTestContracts(
        initialVoiceCreditBalance,
        STATE_TREE_DEPTH,
        true,
        signUpTokenGatekeeperContract,
      );

      maciContract = r.maciContract;
    });

    it("sets MACI instance correctly", async () => {
      await signUpTokenGatekeeperContract.setMaciInstance(await maciContract.address);

      expect(await signUpTokenGatekeeperContract.maci()).to.eq(await maciContract.address);
    });

    it("Reverts if address provided is not a MACI instance", async () => {
      const user = new Keypair();
      const signer = await getDefaultSigner();

      await signUpToken.giveToken(await signer.address, 0);

      await expect(
        maciContract.signUp(
          user.pubKey.asContractParam(),
          utils.defaultAbiCoder.encode(["uint256"], [1]),
          utils.defaultAbiCoder.encode(["uint256"], [0]),
          { gasLimit: 300000 },
        ),
      ).to.be.revertedWithCustomError(signUpTokenGatekeeperContract, "OnlyMACI");
    });
  });
});
