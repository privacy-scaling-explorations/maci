import { expect } from "chai";
import { SNARK_FIELD_SIZE } from "maci-crypto";
import { Keypair } from "maci-domainobjs";
import {
  getBlockTimestamp,
  getDefaultSigner,
  setVerifyingKeys,
  signup,
  publishBatch,
  deployVkRegistryContract,
  type IPublishMessage,
  type IPublishBatchArgs,
  type IPollContractsData,
  deployPoll,
  type IMaciContracts,
  deployMaci,
  deployFreeForAllSignUpPolicy,
  deployConstantInitialVoiceCreditProxy,
  deployVerifier,
  Poll__factory as PollFactory,
} from "maci-sdk";

import type { Signer } from "ethers";

import {
  deployPollArgs,
  deployArgs,
  pollDuration,
  verifyingKeysArgs,
  DEFAULT_INITIAL_VOICE_CREDITS,
  DEFAULT_SG_DATA,
} from "../../constants";

describe("publish", function test() {
  this.timeout(900000);

  let maciAddresses: IMaciContracts;
  let initialVoiceCreditProxyContractAddress: string;
  let verifierContractAddress: string;
  let pollAddresses: IPollContractsData;
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

    const [signupPolicy] = await deployFreeForAllSignUpPolicy(signer, true);
    const signupPolicyContractAddress = await signupPolicy.getAddress();

    const [pollPolicy] = await deployFreeForAllSignUpPolicy(signer, true);
    const pollPolicyContractAddress = await pollPolicy.getAddress();

    const initialVoiceCreditProxy = await deployConstantInitialVoiceCreditProxy(
      DEFAULT_INITIAL_VOICE_CREDITS,
      signer,
      true,
    );
    initialVoiceCreditProxyContractAddress = await initialVoiceCreditProxy.getAddress();

    const verifier = await deployVerifier(signer, true);
    verifierContractAddress = await verifier.getAddress();

    // we deploy the vk registry contract
    const vkRegistryAddress = await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...(await verifyingKeysArgs(signer)), vkRegistryAddress });

    const startDate = await getBlockTimestamp(signer);

    // deploy the smart contracts
    maciAddresses = await deployMaci({
      ...deployArgs,
      signer,
      signupPolicyAddress: signupPolicyContractAddress,
    });

    // deploy a poll contract
    pollAddresses = await deployPoll({
      ...deployPollArgs,
      signer,
      pollStartTimestamp: startDate,
      pollEndTimestamp: startDate + pollDuration,
      relayers: [await signer.getAddress()],
      maciAddress: maciAddresses.maciContractAddress,
      verifierContractAddress,
      vkRegistryContractAddress: vkRegistryAddress,
      policyContractAddress: pollPolicyContractAddress,
      initialVoiceCreditProxyContractAddress,
    });
  });

  describe("publish batch messages", () => {
    const user = new Keypair();

    let defaultArgs: IPublishBatchArgs;

    before(async () => {
      defaultArgs = {
        maciAddress: maciAddresses.maciContractAddress,
        publicKey: user.pubKey.serialize(),
        privateKey: user.privKey.serialize(),
        messages,
        pollId: 0n,
        signer,
      };

      await signup({
        maciAddress: maciAddresses.maciContractAddress,
        maciPubKey: user.pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
    });

    it("should publish messages properly", async () => {
      const pollContract = PollFactory.connect(pollAddresses.pollContractAddress, signer);
      const initialNumMessages = await pollContract.numMessages();

      const { hash, encryptedMessages, privateKeys } = await publishBatch(defaultArgs);
      const numMessages = await pollContract.numMessages();

      expect(initialNumMessages).to.eq(1n);
      expect(hash).to.not.eq(null);
      expect(hash).to.not.eq(undefined);
      expect(numMessages).to.eq(BigInt(messages.length + 1));
      expect(privateKeys.length).to.eq(defaultArgs.messages.length);
      expect(encryptedMessages.length).to.eq(defaultArgs.messages.length);
    });

    it("should throw error if public key is invalid", async () => {
      await expect(publishBatch({ ...defaultArgs, publicKey: "invalid" })).eventually.rejectedWith(
        "Invalid MACI public key",
      );
    });

    it("should throw error if private key is invalid", async () => {
      await expect(publishBatch({ ...defaultArgs, privateKey: "invalid" })).eventually.rejectedWith(
        "Invalid MACI private key",
      );
    });

    it("should throw error if poll id is invalid", async () => {
      await expect(publishBatch({ ...defaultArgs, pollId: -1n })).eventually.rejectedWith("Invalid poll id -1");
    });

    it("should throw error if current poll is not deployed", async () => {
      await expect(publishBatch({ ...defaultArgs, pollId: 9000n })).eventually.rejectedWith(
        "MACI contract doesn't have any deployed poll 9000",
      );
    });

    it("should throw error if message is invalid", async () => {
      await expect(
        publishBatch({
          ...defaultArgs,
          messages: [...messages, { ...messages[0], voteOptionIndex: -1n }],
        }),
      ).eventually.rejectedWith("Invalid vote option index");

      await expect(
        publishBatch({
          ...defaultArgs,
          messages: [...messages, { ...messages[0], stateIndex: 0n }],
        }),
      ).eventually.rejectedWith("Invalid state index");

      await expect(
        publishBatch({
          ...defaultArgs,
          messages: [...messages, { ...messages[0], nonce: -1n }],
        }),
      ).eventually.rejectedWith("Invalid nonce");

      await expect(
        publishBatch({
          ...defaultArgs,
          messages: [...messages, { ...messages[0], salt: SNARK_FIELD_SIZE + 1n }],
        }),
      ).eventually.rejectedWith("Invalid salt");
    });
  });
});
