import { expect } from "chai";
import { Signer } from "ethers";
import { Keypair } from "maci-domainobjs";
import { getBlockTimestamp, getDefaultSigner } from "maci-sdk";

import {
  deploy,
  DeployedContracts,
  deployVkRegistryContract,
  setVerifyingKeys,
  joinPoll,
  signup,
  deployPoll,
  isJoinedUser,
} from "../../ts";
import {
  deployArgs,
  deployPollArgs,
  setVerifyingKeysArgs,
  pollJoiningTestZkeyPath,
  testPollJoiningWasmPath,
  testRapidsnarkPath,
  testPollJoiningWitnessPath,
  pollDuration,
} from "../constants";

describe("joinPoll", function test() {
  let signer: Signer;
  let maciAddresses: DeployedContracts;
  const user = new Keypair();
  const userPrivateKey = user.privKey.serialize();
  const userPublicKey = user.pubKey.serialize();

  const mockStateIndex = 1n;
  const mockPollId = 9000n;

  this.timeout(900000);
  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    const startDate = await getBlockTimestamp(signer);

    // we deploy the vk registry contract
    await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...setVerifyingKeysArgs, signer });
    // deploy the smart contracts
    maciAddresses = await deploy({ ...deployArgs, signer });
    // signup the user
    await signup({
      maciAddress: maciAddresses.maciAddress,
      maciPubKey: userPublicKey,
      signer,
    });

    await deployPoll({ ...deployPollArgs, signer, pollStartDate: startDate, pollEndDate: startDate + pollDuration });
  });

  it("should allow to join the poll and return the user data", async () => {
    const startBlock = await signer.provider?.getBlockNumber();

    await joinPoll({
      maciAddress: maciAddresses.maciAddress,
      privateKey: userPrivateKey,
      stateIndex: 1n,
      signer,
      pollId: 0n,
      pollJoiningZkey: pollJoiningTestZkeyPath,
      useWasm: true,
      pollWasm: testPollJoiningWasmPath,
      pollWitgen: testPollJoiningWitnessPath,
      rapidsnark: testRapidsnarkPath,
      quiet: true,
    });

    const registeredUserData = await isJoinedUser({
      maciAddress: maciAddresses.maciAddress,
      pollId: 0n,
      pollPubKey: user.pubKey.serialize(),
      signer,
      startBlock: startBlock || 0,
      quiet: true,
    });

    expect(registeredUserData.isJoined).to.eq(true);
    expect(BigInt(registeredUserData.pollStateIndex!)).to.eq(1);
  });

  it("should throw error if poll does not exist", async () => {
    await expect(
      joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: userPrivateKey,
        stateIndex: mockStateIndex,
        signer,
        pollId: mockPollId,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        quiet: true,
      }),
    ).eventually.rejectedWith("PollDoesNotExist(9000)");
  });

  it("should throw error if state index is invalid", async () => {
    await expect(
      joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: userPrivateKey,
        stateIndex: -1n,
        signer,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        quiet: true,
      }),
    ).eventually.rejectedWith("Invalid state index");
  });

  it("should throw error if current poll id is invalid", async () => {
    await expect(
      joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: userPrivateKey,
        stateIndex: mockStateIndex,
        signer,
        pollId: -1n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        quiet: true,
      }),
    ).eventually.rejectedWith("Invalid poll id");
  });
});
