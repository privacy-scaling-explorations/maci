import { expect } from "chai";
import { getDefaultSigner } from "maci-contracts";
import { Poll__factory as PollFactory } from "maci-contracts/typechain-types";
import { SNARK_FIELD_SIZE } from "maci-crypto";
import { Keypair } from "maci-domainobjs";

import type { Signer } from "ethers";

import {
  deploy,
  deployPoll,
  deployVkRegistryContract,
  setVerifyingKeys,
  publishBatch,
  signup,
} from "../../ts/commands";
import { DeployedContracts, IPublishBatchArgs, IPublishMessage, PollContracts } from "../../ts/utils";
import { deployPollArgs, setVerifyingKeysArgs, deployArgs } from "../constants";

describe("publish", () => {
  let maciAddresses: DeployedContracts;
  let pollAddresses: PollContracts;
  let signer: Signer;

  const messages: IPublishMessage[] = [
    {
      stateIndex: 1n,
      voteOptionIndex: 1n,
      nonce: 1n,
      newVoteWeight: 1n,
      salt: 1n,
    },
    {
      stateIndex: 1n,
      voteOptionIndex: 2n,
      nonce: 2n,
      newVoteWeight: 1n,
    },
  ];

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...setVerifyingKeysArgs, signer });
  });

  describe("publish batch messages", () => {
    const user = new Keypair();

    let defaultArgs: IPublishBatchArgs;

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });
      // deploy a poll contract
      pollAddresses = await deployPoll({ ...deployPollArgs, signer });

      defaultArgs = {
        maciAddress: maciAddresses.maciAddress,
        publicKey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        messages,
        pollId: 0n,
        signer,
      };

      await signup({ maciAddress: maciAddresses.maciAddress, maciPubKey: user.pubKey.serialize(), signer });
    });

    it("should publish messages properly", async () => {
      const pollContract = PollFactory.connect(pollAddresses.poll, signer);
      const initialNumMessages = await pollContract.numMessages();

      const { hash, encryptedMessages, privateKey } = await publishBatch(defaultArgs);
      const numMessages = await pollContract.numMessages();

      expect(initialNumMessages).to.eq(1n);
      expect(hash).to.not.eq(null);
      expect(hash).to.not.eq(undefined);
      expect(numMessages).to.eq(BigInt(messages.length + 1));
      expect(privateKey).to.not.eq(undefined);
      expect(encryptedMessages.length).to.eq(defaultArgs.messages.length);
    });

    it("should throw error if public key is invalid", async () => {
      await expect(publishBatch({ ...defaultArgs, publicKey: "invalid" })).eventually.rejectedWith(
        "invalid MACI public key",
      );
    });

    it("should throw error if private key is invalid", async () => {
      await expect(publishBatch({ ...defaultArgs, privateKey: "invalid" })).eventually.rejectedWith(
        "invalid MACI private key",
      );
    });

    it("should throw error if poll id is invalid", async () => {
      await expect(publishBatch({ ...defaultArgs, pollId: -1n })).eventually.rejectedWith("invalid poll id -1");
    });

    it("should throw error if current poll is not deployed", async () => {
      await expect(publishBatch({ ...defaultArgs, pollId: 9000n })).eventually.rejectedWith("PollDoesNotExist(9000)");
    });

    it("should throw error if message is invalid", async () => {
      await expect(
        publishBatch({
          ...defaultArgs,
          messages: [...messages, { ...messages[0], voteOptionIndex: -1n }],
        }),
      ).eventually.rejectedWith("invalid vote option index");

      await expect(
        publishBatch({
          ...defaultArgs,
          messages: [...messages, { ...messages[0], stateIndex: 0n }],
        }),
      ).eventually.rejectedWith("invalid state index");

      await expect(
        publishBatch({
          ...defaultArgs,
          messages: [...messages, { ...messages[0], nonce: -1n }],
        }),
      ).eventually.rejectedWith("invalid nonce");

      await expect(
        publishBatch({
          ...defaultArgs,
          messages: [...messages, { ...messages[0], salt: SNARK_FIELD_SIZE + 1n }],
        }),
      ).eventually.rejectedWith("invalid salt");
    });
  });
});
