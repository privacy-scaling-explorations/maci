import { expect } from "chai";
import {
  getBlockTimestamp,
  getDefaultSigner,
  getPoll,
  mergeSignups,
  setVerifyingKeys,
  deployPoll,
  IPollContractsData,
} from "maci-sdk";

import type { Signer } from "ethers";

import { deploy, deployVkRegistryContract, timeTravel } from "../../ts/commands";
import { DeployedContracts } from "../../ts/utils";
import { deployPollArgs, deployArgs, pollDuration, verifyingKeysArgs } from "../constants";
import { clean } from "../utils";

describe("poll", function test() {
  this.timeout(900000);

  let maciAddresses: DeployedContracts;
  let pollAddresses: IPollContractsData;
  let signer: Signer;

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    const vkRegistryAddress = await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...(await verifyingKeysArgs(signer)), vkRegistryAddress });

    const startDate = await getBlockTimestamp(signer);

    // deploy the smart contracts
    maciAddresses = await deploy({ ...deployArgs, signer });

    pollAddresses = await deployPoll({
      ...deployPollArgs,
      signer,
      pollStartTimestamp: startDate,
      pollEndTimestamp: startDate + pollDuration,
      relayers: [await signer.getAddress()],
      maciAddress: maciAddresses.maciAddress,
      verifierContractAddress: maciAddresses.verifierAddress,
      vkRegistryContractAddress: vkRegistryAddress,
      gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
      initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
    });
  });

  describe("check deploy and get poll", () => {
    after(async () => {
      await clean();
    });

    it("should get current poll properly", async () => {
      const pollData = await getPoll({
        maciAddress: maciAddresses.maciAddress,
        signer,
      });
      const samePollData = await getPoll({
        maciAddress: maciAddresses.maciAddress,
        pollId: pollData.id,
        signer,
      });

      expect(pollData.address).to.eq(pollAddresses.pollContractAddress);
      expect(pollData).to.deep.eq(samePollData);
    });

    it("should get finished poll properly", async () => {
      const pollData = await getPoll({
        maciAddress: maciAddresses.maciAddress,
        provider: signer.provider!,
      });

      await timeTravel({ seconds: pollDuration, signer });
      await mergeSignups({ pollId: BigInt(pollData.id), maciAddress: maciAddresses.maciAddress, signer });

      const finishedPollData = await getPoll({
        maciAddress: maciAddresses.maciAddress,
        signer,
      });

      expect(pollData.id).to.eq(finishedPollData.id);
      expect(pollData.address).to.eq(finishedPollData.address);
      expect(finishedPollData.isMerged).to.eq(true);
    });

    it("should throw error if there are no signer and provider", async () => {
      await expect(getPoll({ maciAddress: maciAddresses.maciAddress, pollId: -1n })).eventually.rejectedWith(
        "No signer and provider are provided",
      );
    });

    it("should throw error if current poll id is invalid", async () => {
      await expect(getPoll({ maciAddress: maciAddresses.maciAddress, pollId: -1n, signer })).eventually.rejectedWith(
        "Invalid poll id -1",
      );
    });

    it("should throw error if current poll is not deployed", async () => {
      await expect(getPoll({ maciAddress: maciAddresses.maciAddress, pollId: 9000n, signer })).eventually.rejectedWith(
        "MACI contract doesn't have any deployed poll 9000",
      );
    });
  });
});
