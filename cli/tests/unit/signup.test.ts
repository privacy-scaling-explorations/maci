import { expect } from "chai";
import { Signer } from "ethers";
import { getDefaultSigner } from "maci-contracts";
import { Keypair } from "maci-domainobjs";

import {
  deploy,
  DeployedContracts,
  deployVkRegistryContract,
  isRegisteredUser,
  setVerifyingKeys,
  signup,
} from "../../ts";
import { deployArgs, setVerifyingKeysArgs } from "../constants";

describe("signup", () => {
  let signer: Signer;
  let maciAddresses: DeployedContracts;
  const user = new Keypair();
  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();

    // we deploy the vk registry contract
    await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...setVerifyingKeysArgs, signer });
    // deploy the smart contracts
    maciAddresses = await deploy({ ...deployArgs, signer });
  });

  it("should allow to signup and return the user data", async () => {
    const startBlock = await signer.provider?.getBlockNumber();

    const signUpData = await signup({
      maciAddress: maciAddresses.maciAddress,
      maciPubKey: user.pubKey.serialize(),
      signer,
    });

    const registeredUserData = await isRegisteredUser({
      maciAddress: maciAddresses.maciAddress,
      startBlock,
      maciPubKey: user.pubKey.serialize(),
      signer,
    });

    expect(registeredUserData.isRegistered).to.eq(true);
    expect(registeredUserData.stateIndex).to.eq(signUpData.stateIndex);
  });

  it("should not get the user data if the user is not registered", async () => {
    const registeredUserData = await isRegisteredUser({
      maciAddress: maciAddresses.maciAddress,
      startBlock: await signer.provider?.getBlockNumber(),
      maciPubKey: new Keypair().pubKey.serialize(),
      signer,
    });

    expect(registeredUserData.isRegistered).to.eq(false);
  });

  it("should start fetchig from block zero if the start block is not provided", async () => {
    const registeredUserData = await isRegisteredUser({
      maciAddress: maciAddresses.maciAddress,
      maciPubKey: user.pubKey.serialize(),
      signer,
    });

    expect(registeredUserData.isRegistered).to.eq(true);
  });
});
