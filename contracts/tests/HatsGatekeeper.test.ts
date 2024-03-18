import { expect } from "chai";
import dotenv from "dotenv";
import { AbiCoder, Signer, ZeroAddress } from "ethers";
import { network } from "hardhat";
import { Keypair } from "maci-domainobjs";

import { deployContract } from "../ts/deploy";
import { getSigners, sleep } from "../ts/utils";
import { HatsGatekeeperMultiple, HatsGatekeeperSingle, MACI, MockHatsProtocol } from "../typechain-types";

import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "./constants";
import { deployTestContracts } from "./utils";

dotenv.config();

describe("HatsProtocol Gatekeeper", () => {
  let maciContract: MACI;

  let hatsGatekeeperSingle: HatsGatekeeperSingle;
  let hatsGatekeeperMultiple: HatsGatekeeperMultiple;

  let signer: Signer;
  let voter: Signer;
  let signerAddress: string;
  let voterAddress: string;

  let mockHats: MockHatsProtocol;
  let mockHatsAddress: string;
  const hatsContractOP = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137";

  const user = new Keypair();
  const oneAddress = "0x0000000000000000000000000000000000000001";

  let topHat: bigint;
  let hatId: bigint;
  let secondHatId: bigint;
  let thirdHatId: bigint;

  before(async () => {
    // fork the optimism mainnet network
    if (network.name === "hardhat") {
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: process.env.OP_RPC_URL || "https://optimism.drpc.org",
            },
          },
        ],
      });
    }

    [signer, voter] = await getSigners();
    signerAddress = await signer.getAddress();
    voterAddress = await voter.getAddress();

    // deploy the wrapper around HatsProtocol
    mockHats = await deployContract("MockHatsProtocol", signer, true, hatsContractOP);
    mockHatsAddress = await mockHats.getAddress();

    // create a new topHat
    await mockHats
      .connect(signer)
      .mintTopHat(mockHatsAddress, "MACITOPHAT", "")
      .then((tx) => tx.wait());
    topHat = await mockHats.lastTopHat();

    // create a new hat
    await mockHats.createHat(topHat, "MACI HAT", 2, signerAddress, signerAddress, false, "").then((tx) => tx.wait());
    hatId = await mockHats.lastHat();

    // mint the hat
    await mockHats.mintHat(hatId, signerAddress).then((tx) => tx.wait());

    // create a second hat
    await mockHats.createHat(topHat, "MACI HAT 2", 2, signerAddress, signerAddress, true, "").then((tx) => tx.wait());
    secondHatId = await mockHats.lastHat();

    // mint the hat
    await mockHats.mintHat(secondHatId, voterAddress).then((tx) => tx.wait());

    // create a third hat
    await mockHats.createHat(topHat, "MACI HAT 3", 2, signerAddress, signerAddress, true, "").then((tx) => tx.wait());
    thirdHatId = await mockHats.lastHat();

    // mint the hat
    await mockHats.mintHat(thirdHatId, signerAddress).then((tx) => tx.wait());
    await mockHats.mintHat(thirdHatId, voterAddress).then((tx) => tx.wait());

    // deploy gatekeepers
    hatsGatekeeperSingle = await deployContract("HatsGatekeeperSingle", signer, true, hatsContractOP, hatId);
    hatsGatekeeperMultiple = await deployContract("HatsGatekeeperMultiple", signer, true, hatsContractOP, [
      hatId,
      secondHatId,
    ]);
  });

  after(async () => {
    // we reset
    if (network.name === "hardhat") {
      await network.provider.request({
        method: "hardhat_reset",
        params: [],
      });
    }
  });

  // add some sleep to ensure we don't have problems with the fork
  // as one might use a free RPC plan
  afterEach(async () => {
    await sleep(3000);
  });

  describe("hatsGatekeeperSingle", () => {
    before(async () => {
      const r = await deployTestContracts(
        initialVoiceCreditBalance,
        STATE_TREE_DEPTH,
        signer,
        true,
        true,
        hatsGatekeeperSingle,
      );

      maciContract = r.maciContract;
    });

    describe("Deployment", () => {
      it("should be deployed correctly", async () => {
        expect(hatsGatekeeperSingle).to.not.eq(undefined);
        expect(await hatsGatekeeperSingle.criterionHat()).to.eq(hatId);
        expect(await hatsGatekeeperSingle.maci()).to.eq(ZeroAddress);
        expect(await hatsGatekeeperSingle.hats()).to.eq(hatsContractOP);
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
        await expect(hatsGatekeeperSingle.connect(voter).setMaciInstance(signerAddress)).to.be.revertedWith(
          "Ownable: caller is not the owner",
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
          .connect(signer)
          .signUp(
            user.pubKey.asContractParam(),
            AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          );

        const receipt = await tx.wait();

        expect(receipt?.status).to.eq(1);
      });

      it("should fail to register a user if they do not own the criterion hat", async () => {
        await expect(
          maciContract
            .connect(voter)
            .signUp(
              user.pubKey.asContractParam(),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            ),
        ).to.be.revertedWithCustomError(hatsGatekeeperSingle, "NotWearingCriterionHat");
      });

      it("should prevent signing up twice", async () => {
        await expect(
          maciContract
            .connect(signer)
            .signUp(
              user.pubKey.asContractParam(),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
              AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
            ),
        ).to.be.revertedWithCustomError(hatsGatekeeperSingle, "AlreadyRegistered");
      });
    });
  });

  describe("HatsGatekeeperMultiple", () => {
    before(async () => {
      const r = await deployTestContracts(
        initialVoiceCreditBalance,
        STATE_TREE_DEPTH,
        signer,
        true,
        true,
        hatsGatekeeperMultiple,
      );

      maciContract = r.maciContract;
    });

    describe("Deployment", () => {
      it("should be deployed correctly", async () => {
        expect(hatsGatekeeperMultiple).to.not.eq(undefined);
        expect(await hatsGatekeeperMultiple.maci()).to.eq(ZeroAddress);
        expect(await hatsGatekeeperMultiple.hats()).to.eq(hatsContractOP);
        expect(await hatsGatekeeperMultiple.criterionHat(hatId)).to.eq(true);
        expect(await hatsGatekeeperMultiple.criterionHat(secondHatId)).to.eq(true);
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
        await expect(hatsGatekeeperMultiple.connect(voter).setMaciInstance(signerAddress)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
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
              AbiCoder.defaultAbiCoder().encode(["uint256"], [thirdHatId]),
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
              AbiCoder.defaultAbiCoder().encode(["uint256"], [hatId]),
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
