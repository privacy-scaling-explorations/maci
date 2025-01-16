import { expect } from "chai";
import { BaseContract, Signer, ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

import { deployPollFactory, genEmptyBallotRoots, getDefaultSigner } from "../ts";
import { MACI, PollFactory, Verifier, VkRegistry } from "../typechain-types";

import {
  messageBatchSize,
  initialVoiceCreditBalance,
  STATE_TREE_DEPTH,
  treeDepths,
  ExtContractsStruct,
} from "./constants";
import { deployTestContracts } from "./utils";

describe("pollFactory", () => {
  let maciContract: MACI;
  let verifierContract: Verifier;
  let vkRegistryContract: VkRegistry;
  let extContracts: ExtContractsStruct;
  let pollFactory: PollFactory;
  let signer: Signer;

  const { pubKey: coordinatorPubKey } = new Keypair();

  const emptyBallotRoots = genEmptyBallotRoots(STATE_TREE_DEPTH);
  const emptyBallotRoot = emptyBallotRoots[treeDepths.voteOptionTreeDepth];

  before(async () => {
    signer = await getDefaultSigner();
    const r = await deployTestContracts({ initialVoiceCreditBalance, stateTreeDepth: STATE_TREE_DEPTH, signer });
    maciContract = r.maciContract;
    verifierContract = r.mockVerifierContract as Verifier;
    vkRegistryContract = r.vkRegistryContract;
    extContracts = {
      maci: maciContract,
      verifier: verifierContract,
      vkRegistry: vkRegistryContract,
      gatekeeper: r.gatekeeperContract,
      initialVoiceCreditProxy: r.constantInitialVoiceCreditProxyContract,
    };

    pollFactory = (await deployPollFactory(signer, undefined, true)) as BaseContract as PollFactory;
  });

  describe("deployment", () => {
    it("should allow anyone to deploy a new poll", async () => {
      const tx = await pollFactory.deploy(
        "100",
        treeDepths,
        messageBatchSize,
        coordinatorPubKey.asContractParam(),
        extContracts,
        emptyBallotRoot,
        0n,
        [ZeroAddress],
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.eq(1);
    });
  });
});
