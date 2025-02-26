import { expect } from "chai";
import { Signer } from "ethers";
import { Keypair } from "maci-domainobjs";
import {
  getBlockTimestamp,
  getDefaultSigner,
  getJoinedUserData,
  joinPoll,
  setVerifyingKeys,
  signup,
  deployPoll,
} from "maci-sdk";

import { deploy, DeployedContracts, deployVkRegistryContract } from "../../ts";
import { DEFAULT_IVCP_DATA, DEFAULT_SG_DATA } from "../../ts/utils";
import {
  deployArgs,
  deployPollArgs,
  pollJoiningTestZkeyPath,
  testPollJoiningWasmPath,
  testRapidsnarkPath,
  testPollJoiningWitnessPath,
  pollDuration,
  verifyingKeysArgs,
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
    const vkRegistryAddress = await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...(await verifyingKeysArgs(signer)), vkRegistryAddress });
    // deploy the smart contracts
    maciAddresses = await deploy({ ...deployArgs, signer });
    // signup the user
    await signup({
      maciAddress: maciAddresses.maciAddress,
      maciPubKey: userPublicKey,
      sgData: DEFAULT_SG_DATA,
      signer,
    });

    await deployPoll({
      ...deployPollArgs,
      signer,
      pollStartTimestamp: startDate,
      pollEndTimestamp: startDate + pollDuration,
      relayers: [await signer.getAddress()],
      maciContractAddress: maciAddresses.maciAddress,
      verifierContractAddress: maciAddresses.verifierAddress,
      vkRegistryContractAddress: vkRegistryAddress,
      gatekeeperContractAddress: maciAddresses.signUpGatekeeperAddress,
      initialVoiceCreditProxyContractAddress: maciAddresses.initialVoiceCreditProxyAddress,
    });
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
      sgDataArg: DEFAULT_SG_DATA,
      ivcpDataArg: DEFAULT_IVCP_DATA,
    });

    const registeredUserData = await getJoinedUserData({
      maciAddress: maciAddresses.maciAddress,
      pollId: 0n,
      pollPubKey: user.pubKey.serialize(),
      signer,
      startBlock: startBlock || 0,
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
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
      }),
    ).eventually.rejectedWith("PollDoesNotExist(9000)");
  });

  it("should throw error if state index is invalid", async () => {
    const keypair = new Keypair();

    await expect(
      joinPoll({
        maciAddress: maciAddresses.maciAddress,
        privateKey: keypair.privKey.serialize(),
        stateIndex: -1n,
        signer,
        pollId: 0n,
        pollJoiningZkey: pollJoiningTestZkeyPath,
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
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
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
      }),
    ).eventually.rejectedWith("Invalid poll id");
  });
});
