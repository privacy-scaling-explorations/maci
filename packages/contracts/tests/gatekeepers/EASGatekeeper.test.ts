import { expect } from "chai";
import { Signer, ZeroAddress, toBeArray } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployContract, deployEASSignUpGatekeeper } from "../../ts/deploy";
import { getDefaultSigner, getSigners } from "../../ts/utils";
import { EASChecker, EASGatekeeper, MACI } from "../../typechain-types";
import { STATE_TREE_DEPTH, initialVoiceCreditBalance } from "../constants";
import { deployTestContracts } from "../utils";

describe("EAS Gatekeeper", () => {
  let easGatekeeper: EASGatekeeper;
  let easChecker: EASChecker;
  let signer: Signer;
  let signerAddress: string;
  let easAddress: string;

  const schema = "0xfdcfdad2dbe7489e0ce56b260348b7f14e8365a8a325aef9834818c00d46b31b";

  const revokedAttestation = "0x0000000000000000000000000000000000000000000000000000000000000001";
  const invalidSchemaAttestation = "0x0000000000000000000000000000000000000000000000000000000000000002";
  const invalidRecipientAttestation = "0x0000000000000000000000000000000000000000000000000000000000000003";
  const invalidAttesterAttestation = "0x0000000000000000000000000000000000000000000000000000000000000004";
  // valid attestation
  const attestation = "0x0000000000000000000000000000000000000000000000000000000000000000";

  const user = new Keypair();

  before(async () => {
    signer = await getDefaultSigner();
    signerAddress = await signer.getAddress();
    const mockEAS = await deployContract("MockEAS", signer, true, signerAddress, toBeArray(schema), signerAddress);
    easAddress = await mockEAS.getAddress();
    [easGatekeeper, easChecker] = await deployEASSignUpGatekeeper(
      { eas: easAddress, attester: signerAddress, schema: toBeArray(schema) },
      signer,
      true,
    );
  });

  describe("Deployment", () => {
    it("The gatekeeper should be deployed correctly", async () => {
      expect(easGatekeeper).to.not.eq(undefined);
      expect(await easGatekeeper.getAddress()).to.not.eq(ZeroAddress);
    });
  });

  describe("EASGatekeeper", () => {
    let maciContract: MACI;

    before(async () => {
      const r = await deployTestContracts({
        initialVoiceCreditBalance,
        stateTreeDepth: STATE_TREE_DEPTH,
        signer,
        gatekeeper: easGatekeeper,
      });

      maciContract = r.maciContract;
    });

    it("should set guarded target correctly", async () => {
      const maciAddress = await maciContract.getAddress();
      await easGatekeeper.setTarget(maciAddress).then((tx) => tx.wait());

      expect(await easGatekeeper.guarded()).to.eq(maciAddress);
    });

    it("should fail to set guarded target when the caller is not the owner", async () => {
      const [, secondSigner] = await getSigners();
      await expect(easGatekeeper.connect(secondSigner).setTarget(signerAddress)).to.be.revertedWithCustomError(
        easGatekeeper,
        "OwnableUnauthorizedAccount",
      );
    });

    it("should fail to set guarded target when the MACI instance is not valid", async () => {
      await expect(easGatekeeper.setTarget(ZeroAddress)).to.be.revertedWithCustomError(easGatekeeper, "ZeroAddress");
    });

    it("should throw when the attestation is not owned by the caller (mocking maci.signUp call)", async () => {
      await expect(
        maciContract.signUp(user.pubKey.asContractParam(), invalidRecipientAttestation),
      ).to.be.revertedWithCustomError(easChecker, "NotYourAttestation");
    });

    it("should throw when the attestation has been revoked", async () => {
      await expect(
        maciContract.signUp(user.pubKey.asContractParam(), revokedAttestation),
      ).to.be.revertedWithCustomError(easChecker, "AttestationRevoked");
    });

    it("should throw when the attestation schema is not the one expected by the gatekeeper", async () => {
      await expect(
        maciContract.signUp(user.pubKey.asContractParam(), invalidSchemaAttestation),
      ).to.be.revertedWithCustomError(easChecker, "InvalidSchema");
    });

    it("should throw when the attestation is not signed by the attestation owner", async () => {
      await expect(
        maciContract.signUp(user.pubKey.asContractParam(), invalidAttesterAttestation),
      ).to.be.revertedWithCustomError(easChecker, "AttesterNotTrusted");
    });

    it("should register a user if the register function is called with the valid data", async () => {
      // signup via MACI
      const tx = await maciContract.signUp(user.pubKey.asContractParam(), attestation);

      const receipt = await tx.wait();

      expect(receipt?.status).to.eq(1);
    });

    it("should prevent signing up twice", async () => {
      await expect(maciContract.signUp(user.pubKey.asContractParam(), attestation)).to.be.revertedWithCustomError(
        easGatekeeper,
        "AlreadyRegistered",
      );
    });
  });
});
