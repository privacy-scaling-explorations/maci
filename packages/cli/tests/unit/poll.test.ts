import { expect } from "chai";
import { getDefaultSigner } from "maci-contracts";

import type { Signer } from "ethers";

import {
  deploy,
  deployPoll,
  deployVkRegistryContract,
  setVerifyingKeys,
  getPoll,
  timeTravel,
  mergeMessages,
  mergeSignups,
} from "../../ts/commands";
import { DeployedContracts, PollContracts } from "../../ts/utils";
import { deployPollArgs, setVerifyingKeysArgs, deployArgs } from "../constants";
import { clean } from "../utils";

describe("poll", () => {
  let maciAddresses: DeployedContracts;
  let pollAddresses: PollContracts;
  let signer: Signer;

  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...setVerifyingKeysArgs, signer });
  });

  describe("check deploy and get poll", () => {
    after(async () => {
      await clean();
    });

    before(async () => {
      // deploy the smart contracts
      maciAddresses = await deploy({ ...deployArgs, signer });
      // deploy a poll contract
      pollAddresses = await deployPoll({ ...deployPollArgs, signer });
    });

    it("should get current poll properly", async () => {
      const pollData = await getPoll({ maciAddress: maciAddresses.maciAddress, signer });
      const samePollData = await getPoll({ maciAddress: maciAddresses.maciAddress, pollId: pollData.id, signer });

      expect(pollData.address).to.eq(pollAddresses.poll);
      expect(pollData).to.deep.eq(samePollData);
    });

    it("should get finished poll properly", async () => {
      const pollData = await getPoll({ maciAddress: maciAddresses.maciAddress, provider: signer.provider! });

      await timeTravel({ seconds: Number(pollData.duration), signer });
      await mergeMessages({ pollId: BigInt(pollData.id), signer });
      await mergeSignups({ pollId: BigInt(pollData.id), signer });

      const finishedPollData = await getPoll({ maciAddress: maciAddresses.maciAddress, signer });

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
