import { expect } from "chai";
import { Signer } from "ethers";
import { Keypair } from "maci-domainobjs";
import {
  getDefaultSigner,
  getSignedupUserData,
  type IMaciContracts,
  setVerifyingKeys,
  signup,
  deployMaci,
  deployFreeForAllSignUpPolicy,
  deployVkRegistryContract,
} from "maci-sdk";

import { deployArgs, verifyingKeysArgs, DEFAULT_SG_DATA } from "../../constants";

describe("signup", function test() {
  this.timeout(900000);

  let signer: Signer;
  let maciAddresses: IMaciContracts;

  const user = new Keypair();
  // before all tests we deploy the vk registry contract and set the verifying keys
  before(async () => {
    signer = await getDefaultSigner();
    const [signupPolicy] = await deployFreeForAllSignUpPolicy(signer, true);
    const signupPolicyContractAddress = await signupPolicy.getAddress();

    // we deploy the vk registry contract
    const vkRegistryAddress = await deployVkRegistryContract({ signer });
    // we set the verifying keys
    await setVerifyingKeys({ ...(await verifyingKeysArgs(signer)), vkRegistryAddress });

    // deploy the smart contracts
    maciAddresses = await deployMaci({
      ...deployArgs,
      signer,
      signupPolicyAddress: signupPolicyContractAddress,
    });
  });

  it("should allow to signup and return the user data", async () => {
    const startBlock = await signer.provider?.getBlockNumber();

    const signUpData = await signup({
      maciAddress: maciAddresses.maciContractAddress,
      maciPubKey: user.pubKey.serialize(),
      sgData: DEFAULT_SG_DATA,
      signer,
    });

    const registeredUserData = await getSignedupUserData({
      maciAddress: maciAddresses.maciContractAddress,
      startBlock,
      maciPubKey: user.pubKey.serialize(),
      signer,
    });

    expect(registeredUserData.isRegistered).to.eq(true);
    expect(registeredUserData.stateIndex).to.eq(signUpData.stateIndex);
  });

  it("should not get the user data if the user is not registered", async () => {
    const registeredUserData = await getSignedupUserData({
      maciAddress: maciAddresses.maciContractAddress,
      startBlock: await signer.provider?.getBlockNumber(),
      maciPubKey: new Keypair().pubKey.serialize(),
      signer,
    });

    expect(registeredUserData.isRegistered).to.eq(false);
  });

  it("should start fetchig from block zero if the start block is not provided", async () => {
    const registeredUserData = await getSignedupUserData({
      maciAddress: maciAddresses.maciContractAddress,
      maciPubKey: user.pubKey.serialize(),
      signer,
    });

    expect(registeredUserData.isRegistered).to.eq(true);
  });
});
