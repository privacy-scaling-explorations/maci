import { expect } from "chai";
import { AbiCoder, Signer, ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployContract, getDefaultSigner, getSigners } from "../ts";
import { GitcoinPassportGatekeeper, MACI, MockGitcoinPassportDecoder } from "../typechain-types";

import { initialVoiceCreditBalance, STATE_TREE_DEPTH } from "./constants";
import { deployTestContracts } from "./utils";

describe("GitcoinPassport Gatekeeper", () => {
  let gitcoinGatekeeper: GitcoinPassportGatekeeper;
  let maciContract: MACI;
  let mockDecoder: MockGitcoinPassportDecoder;

  let signer: Signer;
  let signerAddress: string;
  let decoderAddress: string;

  // @note score is 4 digit (2 decimals)
  // 50.00
  const passingScore = 5000;

  const user = new Keypair();

  before(async () => {
    signer = await getDefaultSigner();
    signerAddress = await signer.getAddress();
    mockDecoder = await deployContract("MockGitcoinPassportDecoder", signer, true);
    decoderAddress = await mockDecoder.getAddress();
    gitcoinGatekeeper = await deployContract("GitcoinPassportGatekeeper", signer, true, decoderAddress, passingScore);

    const r = await deployTestContracts({
      initialVoiceCreditBalance,
      stateTreeDepth: STATE_TREE_DEPTH,
      signer,
      gatekeeper: gitcoinGatekeeper,
    });
    maciContract = r.maciContract;
  });

  describe("Deployment", () => {
    it("The gatekeeper should be deployed correctly", async () => {
      expect(gitcoinGatekeeper).to.not.eq(undefined);
      expect(await gitcoinGatekeeper.getAddress()).to.not.eq(ZeroAddress);
    });

    it("should fail to deploy when the decoder contract address is not valid", async () => {
      await expect(
        deployContract("GitcoinPassportGatekeeper", signer, true, ZeroAddress, passingScore),
      ).to.be.revertedWithCustomError(gitcoinGatekeeper, "ZeroAddress");
    });
  });

  describe("GitcoinGakeeper", () => {
    it("sets MACI instance correctly", async () => {
      const maciAddress = await maciContract.getAddress();
      await gitcoinGatekeeper.setMaciInstance(maciAddress).then((tx) => tx.wait());

      expect(await gitcoinGatekeeper.maci()).to.eq(maciAddress);
    });

    it("should fail to set MACI instance when the caller is not the owner", async () => {
      const [, secondSigner] = await getSigners();
      await expect(
        gitcoinGatekeeper.connect(secondSigner).setMaciInstance(signerAddress),
      ).to.be.revertedWithCustomError(gitcoinGatekeeper, "OwnableUnauthorizedAccount");
    });

    it("should fail to set MACI instance when the MACI instance is not valid", async () => {
      await expect(gitcoinGatekeeper.setMaciInstance(ZeroAddress)).to.be.revertedWithCustomError(
        gitcoinGatekeeper,
        "ZeroAddress",
      );
    });

    it("should throw when the score is not high enough", async () => {
      await gitcoinGatekeeper.setMaciInstance(signerAddress).then((tx) => tx.wait());

      await expect(gitcoinGatekeeper.register(signerAddress, "0x")).to.be.revertedWithCustomError(
        gitcoinGatekeeper,
        "ScoreTooLow",
      );
    });

    it("should allow to signup when the score is high enough", async () => {
      await mockDecoder.changeScore(passingScore * 100).then((tx) => tx.wait());
      await gitcoinGatekeeper.register(signerAddress, "0x").then((tx) => tx.wait());

      expect(await gitcoinGatekeeper.registeredUsers(signerAddress)).to.eq(true);
    });

    it("should prevent signing up twice", async () => {
      await expect(gitcoinGatekeeper.register(signerAddress, "0x")).to.be.revertedWithCustomError(
        gitcoinGatekeeper,
        "AlreadyRegistered",
      );
    });

    it("should signup via MACI", async () => {
      const [, secondSigner] = await getSigners();

      await gitcoinGatekeeper.setMaciInstance(await maciContract.getAddress()).then((tx) => tx.wait());

      const tx = await maciContract
        .connect(secondSigner)
        .signUp(
          user.pubKey.asContractParam(),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
        );

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);
    });
  });
});
