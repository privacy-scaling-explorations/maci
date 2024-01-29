import { expect } from "chai";
import dotenv from "dotenv";
import { AbiCoder, Signer, ZeroAddress, toBeArray } from "ethers";
import { ethers, network } from "hardhat";
import { Keypair } from "maci-domainobjs";

import { deployContract } from "../ts/deploy";
import { getDefaultSigner, getSigners, sleep } from "../ts/utils";
import { EASGatekeeper, MACI } from "../typechain-types";

import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "./constants";
import { deployTestContracts } from "./utils";

dotenv.config();

describe("EAS Gatekeeper", () => {
  let easGatekeeper: EASGatekeeper;
  let signer: Signer;
  let signerAddress: string;

  const schema = "0xfdcfdad2dbe7489e0ce56b260348b7f14e8365a8a325aef9834818c00d46b31b";
  const easAddress = "0x4200000000000000000000000000000000000021";
  const attestation = "0xe9d4e5a14ec840656d9def34075d9523d1536176d5f0a7d574f2e93bea641b66";
  const revokedAttestation = "0x10207e0381318820574f8c99efde13b9dfe0b24114c9ec5337109d2435a8f13b";
  const invalidAttesterAttestation = "0x5f66cb6eaebece82ec3a47918afee718afa7dca838faab1ee156df3a6187cb9c";
  const attestationOwner = "0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1";
  const trustedAttester = "0x621477dBA416E12df7FF0d48E14c4D20DC85D7D9";
  // random gitcoin passport attestation
  const wrongAttestation = "0x8c60cf319b553194519098c7ecaad38fc0e818c538b939730c0b55bb1eeedaae";

  const user = new Keypair();

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
    signer = await getDefaultSigner();
    signerAddress = await signer.getAddress();
    easGatekeeper = await deployContract("EASGatekeeper", signer, true, easAddress, trustedAttester, toBeArray(schema));
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

  describe("Deployment", () => {
    it("The gatekeeper should be deployed correctly", () => {
      expect(easGatekeeper).to.not.eq(undefined);
    });

    it("should fail to deploy when the eas contract address is not valid", async () => {
      await expect(
        deployContract("EASGatekeeper", signer, true, ZeroAddress, trustedAttester, toBeArray(schema)),
      ).to.be.revertedWithCustomError(easGatekeeper, "ZeroAddress");
    });

    it("should fail to deploy when the attester address is not valid", async () => {
      await expect(
        deployContract("EASGatekeeper", signer, true, easAddress, ZeroAddress, toBeArray(schema)),
      ).to.be.revertedWithCustomError(easGatekeeper, "ZeroAddress");
    });
  });

  describe("EASGatekeeper", () => {
    let maciContract: MACI;

    before(async () => {
      const r = await deployTestContracts(initialVoiceCreditBalance, STATE_TREE_DEPTH, signer, true, easGatekeeper);

      maciContract = r.maciContract;
    });

    it("sets MACI instance correctly", async () => {
      const maciAddress = await maciContract.getAddress();
      const tx = await easGatekeeper.setMaciInstance(maciAddress);
      await tx.wait();

      expect(await easGatekeeper.maci()).to.eq(maciAddress);
    });

    it("should fail to set MACI instance when the caller is not the owner", async () => {
      const [, secondSigner] = await getSigners();
      await expect(easGatekeeper.connect(secondSigner).setMaciInstance(signerAddress)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("should fail to set MACI instance when the MACI instance is not valid", async () => {
      await expect(easGatekeeper.setMaciInstance(ZeroAddress)).to.be.revertedWithCustomError(
        easGatekeeper,
        "ZeroAddress",
      );
    });

    it("should throw when the attestation is not owned by the caller (mocking maci.signUp call)", async () => {
      await easGatekeeper.setMaciInstance(signerAddress);

      await expect(easGatekeeper.register(signerAddress, toBeArray(attestation))).to.be.revertedWithCustomError(
        easGatekeeper,
        "NotYourAttestation",
      );
    });

    it("should throw when the attestation has been revoked", async () => {
      await expect(easGatekeeper.register(signerAddress, toBeArray(revokedAttestation))).to.be.revertedWithCustomError(
        easGatekeeper,
        "AttestationRevoked",
      );
    });

    it("should throw when the attestation schema is not the one expected by the gatekeeper", async () => {
      await easGatekeeper.setMaciInstance(signerAddress);
      await expect(easGatekeeper.register(signerAddress, toBeArray(wrongAttestation))).to.be.revertedWithCustomError(
        easGatekeeper,
        "InvalidSchema",
      );
    });

    it("should throw when the attestation is not signed by the attestation owner", async () => {
      await easGatekeeper.setMaciInstance(signerAddress);
      await expect(
        easGatekeeper.register(signerAddress, toBeArray(invalidAttesterAttestation)),
      ).to.be.revertedWithCustomError(easGatekeeper, "AttesterNotTrusted");
    });

    it("should register a user if the register function is called with the valid data", async () => {
      // impersonate a user that owns the attestation
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [attestationOwner],
      });

      const userSigner = await ethers.getSigner(attestationOwner);

      await easGatekeeper.setMaciInstance(await maciContract.getAddress());

      // signup via MACI
      const tx = await maciContract
        .connect(userSigner)
        .signUp(
          user.pubKey.asContractParam(),
          toBeArray(attestation),
          AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
        );

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);
    });

    it("should prevent signing up twice", async () => {
      // impersonate a user that owns the attestation
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [attestationOwner],
      });

      const userSigner = await ethers.getSigner(attestationOwner);

      await expect(
        maciContract
          .connect(userSigner)
          .signUp(
            user.pubKey.asContractParam(),
            toBeArray(attestation),
            AbiCoder.defaultAbiCoder().encode(["uint256"], [1]),
          ),
      ).to.be.revertedWithCustomError(easGatekeeper, "AlreadyRegistered");
    });
  });
});
