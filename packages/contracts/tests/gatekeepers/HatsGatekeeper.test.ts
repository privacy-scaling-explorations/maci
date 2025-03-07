import { expect } from "chai";
import { AbiCoder, Signer, ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployContract } from "../../ts/deploy";
import { getSigners } from "../../ts/utils";
import { HatsGatekeeperMultiple, HatsGatekeeperSingle, MACI, MockHatsProtocol } from "../../typechain-types";
import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "../constants";
import { deployTestContracts } from "../utils";

describe("HatsProtocol Gatekeeper", () => {
  let maciContract: MACI;

  let hatsGatekeeperSingle: HatsGatekeeperSingle;
  let hatsGatekeeperMultiple: HatsGatekeeperMultiple;

  let signer: Signer;
  let voter: Signer;
  let signerAddress: string;

  let mockHats: MockHatsProtocol;
  let mockHatsAddress: string;

  const user = new Keypair();

  const hatId = 1;
  const secondHatId = 2;
  const thirdHatId = 50;

  before(async () => {
    [signer, voter] = await getSigners();
    signerAddress = await signer.getAddress();

    // deploy Mock Hats Protocol contract
    mockHats = await deployContract("MockHatsProtocol", signer, true);
    mockHatsAddress = await mockHats.getAddress();

    // deploy gatekeepers
    hatsGatekeeperSingle = await deployContract("HatsGatekeeperSingle", signer, true, mockHatsAddress, hatId);
    hatsGatekeeperMultiple = await deployContract("HatsGatekeeperMultiple", signer, true, mockHatsAddress, [
      hatId,
      thirdHatId,
    ]);
  });

  describe("hatsGatekeeperSingle", () => {
    before(async () => {
      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
        gatekeeper: hatsGatekeeperSingle,
      });

      maciContract = r.maciContract;
    });

    describe("Deployment", () => {
      it("should be deployed correctly", async () => {
        expect(hatsGatekeeperSingle).to.not.eq(undefined);
        expect(await hatsGatekeeperSingle.criterionHat()).to.eq(hatId);
        expect(await hatsGatekeeperSingle.hats()).to.eq(mockHatsAddress);
      });
    });

    describe("setMaci", () => {
      it("should set guarded target correctly", async () => {
        const maciAddress = await maciContract.getAddress();
        await hatsGatekeeperSingle.setTarget(maciAddress).then((tx) => tx.wait());

        expect(await hatsGatekeeperSingle.guarded()).to.eq(maciAddress);
      });

      it("should fail to set guarded target to the zero address", async () => {
        await expect(hatsGatekeeperSingle.setTarget(ZeroAddress)).to.be.revertedWithCustomError(
          hatsGatekeeperSingle,
          "ZeroAddress",
        );
      });

      it("should fail to set guarded target when the caller is not the owner", async () => {
        await expect(hatsGatekeeperSingle.connect(voter).setTarget(signerAddress)).to.be.revertedWithCustomError(
          hatsGatekeeperSingle,
          "OwnableUnauthorizedAccount",
        );
      });
    });

    describe("register", () => {
      it("should not allow to call from a non-registered MACI contract", async () => {
        await expect(
          hatsGatekeeperSingle.enforce(await signer.getAddress(), AbiCoder.defaultAbiCoder().encode(["uint256"], [1])),
        ).to.be.revertedWithCustomError(hatsGatekeeperSingle, "TargetOnly");
      });

      it("should register a user if the register function is called with the valid data", async () => {
        // signup via MACI
        const tx = await maciContract
          .connect(voter)
          .signUp(user.pubKey.asContractParam(), AbiCoder.defaultAbiCoder().encode(["uint256"], [hatId]));

        const receipt = await tx.wait();

        expect(receipt?.status).to.eq(1);
      });

      it("should prevent signing up twice", async () => {
        await expect(
          maciContract
            .connect(voter)
            .signUp(user.pubKey.asContractParam(), AbiCoder.defaultAbiCoder().encode(["uint256"], [hatId])),
        ).to.be.revertedWithCustomError(hatsGatekeeperSingle, "AlreadyRegistered");
      });
    });
  });

  describe("HatsGatekeeperMultiple", () => {
    before(async () => {
      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
        gatekeeper: hatsGatekeeperMultiple,
      });

      maciContract = r.maciContract;
    });

    describe("Deployment", () => {
      it("should be deployed correctly", async () => {
        expect(hatsGatekeeperMultiple).to.not.eq(undefined);
        expect(await hatsGatekeeperMultiple.hats()).to.eq(mockHatsAddress);
        expect(await hatsGatekeeperMultiple.criterionHat(hatId)).to.eq(true);
        expect(await hatsGatekeeperMultiple.criterionHat(thirdHatId)).to.eq(true);
      });
    });

    describe("setMaci", () => {
      it("should set guarded target correctly", async () => {
        const maciAddress = await maciContract.getAddress();
        await hatsGatekeeperMultiple.setTarget(maciAddress).then((tx) => tx.wait());

        expect(await hatsGatekeeperMultiple.guarded()).to.eq(maciAddress);
      });

      it("should fail to set guarded target to the zero address", async () => {
        await expect(hatsGatekeeperMultiple.setTarget(ZeroAddress)).to.be.revertedWithCustomError(
          hatsGatekeeperMultiple,
          "ZeroAddress",
        );
      });

      it("should fail to set guarded target when the caller is not the owner", async () => {
        await expect(hatsGatekeeperMultiple.connect(voter).setTarget(signerAddress)).to.be.revertedWithCustomError(
          hatsGatekeeperMultiple,
          "OwnableUnauthorizedAccount",
        );
      });
    });

    describe("register", () => {
      it("should not allow to call from a non-registered MACI contract", async () => {
        await expect(
          hatsGatekeeperMultiple
            .connect(signer)
            .enforce(await signer.getAddress(), AbiCoder.defaultAbiCoder().encode(["uint256"], [1])),
        ).to.be.revertedWithCustomError(hatsGatekeeperMultiple, "TargetOnly");
      });

      it("should register a user if the register function is called with the valid data", async () => {
        const keypair = new Keypair();
        // signup via MACI
        const tx = await maciContract
          .connect(signer)
          .signUp(keypair.pubKey.asContractParam(), AbiCoder.defaultAbiCoder().encode(["uint256"], [hatId]));

        const receipt = await tx.wait();

        expect(receipt?.status).to.eq(1);
      });

      it("should fail to register a user if they pass a non-criterion hat", async () => {
        await expect(
          maciContract
            .connect(voter)
            .signUp(user.pubKey.asContractParam(), AbiCoder.defaultAbiCoder().encode(["uint256"], [secondHatId])),
        ).to.be.revertedWithCustomError(hatsGatekeeperMultiple, "NotCriterionHat");
      });

      it("should fail to register a user if they do not own a criterion hat", async () => {
        // get another signer
        const [, , another] = await getSigners();

        await expect(
          maciContract
            .connect(another)
            .signUp(user.pubKey.asContractParam(), AbiCoder.defaultAbiCoder().encode(["uint256"], [thirdHatId])),
        ).to.be.revertedWithCustomError(hatsGatekeeperMultiple, "NotWearingCriterionHat");
      });

      it("should prevent signing up twice", async () => {
        await expect(
          maciContract
            .connect(signer)
            .signUp(user.pubKey.asContractParam(), AbiCoder.defaultAbiCoder().encode(["uint256"], [hatId])),
        ).to.be.revertedWithCustomError(hatsGatekeeperMultiple, "AlreadyRegistered");
      });
    });
  });
});
