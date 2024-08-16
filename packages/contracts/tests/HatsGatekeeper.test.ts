import { expect } from "chai";
import { AbiCoder, Signer, ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployContract } from "../ts/deploy";
import { getSigners } from "../ts/utils";
import { HatsGatekeeperMultiple, HatsGatekeeperSingle, MACI, MockHatsProtocol } from "../typechain-types";

import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "./constants";
import { deployTestContracts } from "./utils";

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
  const oneAddress = "0x0000000000000000000000000000000000000001";

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
        expect(await hatsGatekeeperSingle.maci()).to.eq(ZeroAddress);
        expect(await hatsGatekeeperSingle.hats()).to.eq(mockHatsAddress);
      });
    });

    describe("setMaci", () => {
      it("should set the MACI instance correctly", async () => {
        const maciAddress = await maciContract.getAddress();
        await hatsGatekeeperSingle.setMaciInstance(maciAddress).then((tx) => tx.wait());

        expect(await hatsGatekeeperSingle.maci()).to.eq(maciAddress);
      });

      it("should fail to set MACI instance to the zero address", async () => {
        await expect(hatsGatekeeperSingle.setMaciInstance(ZeroAddress)).to.be.revertedWithCustomError(
          hatsGatekeeperSingle,
          "ZeroAddress",
        );
      });

      it("should fail to set MACI instance when the caller is not the owner", async () => {
        await expect(hatsGatekeeperSingle.connect(voter).setMaciInstance(signerAddress)).to.be.revertedWithCustomError(
          hatsGatekeeperSingle,
          "OwnableUnauthorizedAccount",
        );
      });
    });

    describe("register", () => {
      it("should not allow to call from a non-registered MACI contract", async () => {
        await hatsGatekeeperSingle.setMaciInstance(oneAddress).then((tx) => tx.wait());
        await expect(
          maciContract
            .connect(signer)
            .signUp(
              user.pubKey.asContractParam(),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            ),
        ).to.be.revertedWithCustomError(hatsGatekeeperSingle, "OnlyMACI");
      });

      it("should register a user if the register function is called with the valid data", async () => {
        await hatsGatekeeperSingle.setMaciInstance(await maciContract.getAddress()).then((tx) => tx.wait());

        // signup via MACI
        const tx = await maciContract
          .connect(voter)
          .signUp(
            user.pubKey.asContractParam(),
            AbiCoder.defaultAbiCoder().encode(["uint256"], [hatId]),
            AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          );

        const receipt = await tx.wait();

        expect(receipt?.status).to.eq(1);
      });

      it("should prevent signing up twice", async () => {
        await expect(
          maciContract
            .connect(voter)
            .signUp(
              user.pubKey.asContractParam(),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [hatId]),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            ),
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
        expect(await hatsGatekeeperMultiple.maci()).to.eq(ZeroAddress);
        expect(await hatsGatekeeperMultiple.hats()).to.eq(mockHatsAddress);
        expect(await hatsGatekeeperMultiple.criterionHat(hatId)).to.eq(true);
        expect(await hatsGatekeeperMultiple.criterionHat(thirdHatId)).to.eq(true);
      });
    });

    describe("setMaci", () => {
      it("should set the MACI instance correctly", async () => {
        const maciAddress = await maciContract.getAddress();
        await hatsGatekeeperMultiple.setMaciInstance(maciAddress).then((tx) => tx.wait());

        expect(await hatsGatekeeperMultiple.maci()).to.eq(maciAddress);
      });

      it("should fail to set MACI instance to the zero address", async () => {
        await expect(hatsGatekeeperMultiple.setMaciInstance(ZeroAddress)).to.be.revertedWithCustomError(
          hatsGatekeeperMultiple,
          "ZeroAddress",
        );
      });

      it("should fail to set MACI instance when the caller is not the owner", async () => {
        await expect(
          hatsGatekeeperMultiple.connect(voter).setMaciInstance(signerAddress),
        ).to.be.revertedWithCustomError(hatsGatekeeperMultiple, "OwnableUnauthorizedAccount");
      });
    });

    describe("register", () => {
      it("should not allow to call from a non-registered MACI contract", async () => {
        await hatsGatekeeperMultiple
          .connect(signer)
          .setMaciInstance(oneAddress)
          .then((tx) => tx.wait());
        await expect(
          maciContract
            .connect(signer)
            .signUp(
              user.pubKey.asContractParam(),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            ),
        ).to.be.revertedWithCustomError(hatsGatekeeperMultiple, "OnlyMACI");
      });

      it("should register a user if the register function is called with the valid data", async () => {
        await hatsGatekeeperMultiple.connect(signer).setMaciInstance(await maciContract.getAddress());

        // signup via MACI
        const tx = await maciContract
          .connect(signer)
          .signUp(
            user.pubKey.asContractParam(),
            AbiCoder.defaultAbiCoder().encode(["uint256"], [hatId]),
            AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          );

        const receipt = await tx.wait();

        expect(receipt?.status).to.eq(1);
      });

      it("should fail to register a user if they pass a non-criterion hat", async () => {
        await expect(
          maciContract
            .connect(voter)
            .signUp(
              user.pubKey.asContractParam(),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [secondHatId]),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            ),
        ).to.be.revertedWithCustomError(hatsGatekeeperMultiple, "NotCriterionHat");
      });

      it("should fail to register a user if they do not own a criterion hat", async () => {
        // get another signer
        const [, , another] = await getSigners();

        await expect(
          maciContract
            .connect(another)
            .signUp(
              user.pubKey.asContractParam(),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [thirdHatId]),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            ),
        ).to.be.revertedWithCustomError(hatsGatekeeperMultiple, "NotWearingCriterionHat");
      });

      it("should prevent signing up twice", async () => {
        await expect(
          maciContract
            .connect(signer)
            .signUp(
              user.pubKey.asContractParam(),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [hatId]),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            ),
        ).to.be.revertedWithCustomError(hatsGatekeeperMultiple, "AlreadyRegistered");
      });
    });
  });
});
