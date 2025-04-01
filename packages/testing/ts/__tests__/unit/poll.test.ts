import {
  getBlockTimestamp,
  getDefaultSigner,
  getPoll,
  mergeSignups,
  setVerifyingKeys,
  deployPoll,
  deployVkRegistryContract,
  timeTravel,
  type IPollContractsData,
  type IMaciContracts,
  deployFreeForAllSignUpPolicy,
  deployConstantInitialVoiceCreditProxy,
  deployVerifier,
  deployMaci,
} from "@maci-protocol/sdk";
import { expect } from "chai";

import type { Signer } from "ethers";

import {
  deployPollArgs,
  deployArgs,
  pollDuration,
  verifyingKeysArgs,
  DEFAULT_INITIAL_VOICE_CREDITS,
} from "../../constants";

describe("poll", function test() {
  this.timeout(900000);

  let maciAddresses: IMaciContracts;
  let initialVoiceCreditProxyContractAddress: string;
  let verifierContractAddress: string;
  let pollAddresses: IPollContractsData;
  let signer: Signer;

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    const [signupPolicy] = await deployFreeForAllSignUpPolicy(signer, true);
    const signupPolicyContractAddress = await signupPolicy.getAddress();

    const [pollPolicy] = await deployFreeForAllSignUpPolicy(signer, true);
    const pollPolicyContractAddress = await pollPolicy.getAddress();

    const [initialVoiceCreditProxy] = await deployConstantInitialVoiceCreditProxy(
      { amount: DEFAULT_INITIAL_VOICE_CREDITS },
      signer,
      undefined,
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

  describe("check deploy and get poll", () => {
    it("should get current poll properly", async () => {
      const pollData = await getPoll({
        maciAddress: maciAddresses.maciContractAddress,
        signer,
      });
      const samePollData = await getPoll({
        maciAddress: maciAddresses.maciContractAddress,
        pollId: pollData.id,
        signer,
      });

      expect(pollData.address).to.eq(pollAddresses.pollContractAddress);
      expect(pollData).to.deep.eq(samePollData);
    });

    it("should get finished poll properly", async () => {
      const pollData = await getPoll({
        maciAddress: maciAddresses.maciContractAddress,
        provider: signer.provider!,
      });

      await timeTravel({ seconds: pollDuration, signer });
      await mergeSignups({ pollId: BigInt(pollData.id), maciAddress: maciAddresses.maciContractAddress, signer });

      const finishedPollData = await getPoll({
        maciAddress: maciAddresses.maciContractAddress,
        signer,
      });

      expect(pollData.id).to.eq(finishedPollData.id);
      expect(pollData.address).to.eq(finishedPollData.address);
      expect(finishedPollData.isMerged).to.eq(true);
    });

    it("should throw error if there are no signer and provider", async () => {
      await expect(getPoll({ maciAddress: maciAddresses.maciContractAddress, pollId: -1n })).eventually.rejectedWith(
        "No signer and provider are provided",
      );
    });

    it("should throw error if current poll id is invalid", async () => {
      await expect(
        getPoll({ maciAddress: maciAddresses.maciContractAddress, pollId: -1n, signer }),
      ).eventually.rejectedWith("Invalid poll id -1");
    });

    it("should throw error if current poll is not deployed", async () => {
      await expect(
        getPoll({ maciAddress: maciAddresses.maciContractAddress, pollId: 9000n, signer }),
      ).eventually.rejectedWith("MACI contract doesn't have any deployed poll 9000");
    });
  });
});
