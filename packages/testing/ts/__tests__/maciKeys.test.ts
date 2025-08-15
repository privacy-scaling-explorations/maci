import { generatePrivateKey, generatePublicKey } from "@maci-protocol/crypto";
import { Keypair, PrivateKey, PublicKey } from "@maci-protocol/domainobjs";
import { Poll__factory as PollFactory, type Poll, getDefaultSigner } from "@maci-protocol/sdk";
import { expect } from "chai";

import type { Signer } from "ethers";

import {
  testRapidsnarkPath,
  testPollJoinedZkeyPath,
  testPollJoiningZkeyPath,
  testPollJoiningWasmPath,
  testPollJoiningWitnessPath,
  testProcessMessageNonQvZkeyPath,
  testVoteTallyNonQvZkeyPath,
} from "../constants";
import { TestingClass } from "../testingClass";

describe("integration tests private/public/keypair", () => {
  describe("crypto/domainobjs", () => {
    it("should serialize and deserialize a private key correctly", () => {
      const privateKeyCrypto = generatePrivateKey();

      const privateKeyDomainobjs = new PrivateKey(privateKeyCrypto);
      const privateKeyDomainobjsSerialized = privateKeyDomainobjs.serialize();

      const privateKeyDomainobjsDeserialized = PrivateKey.deserialize(privateKeyDomainobjsSerialized);

      expect(privateKeyDomainobjsDeserialized.raw.toString()).to.eq(privateKeyCrypto.toString());
    });

    it("should serialize and deserialize a public key correctly", () => {
      const privateKeyCrypto = generatePrivateKey();

      const publicKeyCrypto = generatePublicKey(privateKeyCrypto);

      const publicKeyDomainobjs = new PublicKey(publicKeyCrypto);

      const publicKeyDomainobjsSerialized = publicKeyDomainobjs.serialize();
      const publicKeyDomainobjsDeserialized = PublicKey.deserialize(publicKeyDomainobjsSerialized);

      expect(publicKeyDomainobjsDeserialized.raw[0].toString()).to.eq(publicKeyCrypto[0].toString());
      expect(publicKeyDomainobjsDeserialized.raw[1].toString()).to.eq(publicKeyCrypto[1].toString());
    });

    it("should serialize and deserialize a private key correct after serializing as contract params", () => {
      const privateKeyCrypto = generatePrivateKey();

      const privateKeyDomainobjs = new PrivateKey(privateKeyCrypto);
      const keypairDomainobjs = new Keypair(privateKeyDomainobjs);

      const publicKeyDomainobjsAsContractParam = keypairDomainobjs.publicKey.asContractParam();

      const privateKeyDomainobjsSerialized = privateKeyDomainobjs.serialize();

      const privateKeyDomainobjsDeserialized = PrivateKey.deserialize(privateKeyDomainobjsSerialized);
      const keypairDomainobjsDeserialized = new Keypair(privateKeyDomainobjsDeserialized);

      expect(keypairDomainobjsDeserialized.publicKey.raw[0].toString()).to.eq(
        publicKeyDomainobjsAsContractParam.x.toString(),
      );
      expect(keypairDomainobjsDeserialized.publicKey.raw[1].toString()).to.eq(
        publicKeyDomainobjsAsContractParam.y.toString(),
      );
    });
  });

  describe("crypto/domainobjs/contracts", () => {
    let pollContract: Poll;

    let testingClass: TestingClass;

    let signer: Signer;
    const coordinatorKeypair = new Keypair();

    before(async () => {
      signer = await getDefaultSigner();

      testingClass = await TestingClass.getInstance({
        pollJoiningZkeyPath: testPollJoiningZkeyPath,
        pollJoinedZkeyPath: testPollJoinedZkeyPath,
        messageProcessorZkeyPath: testProcessMessageNonQvZkeyPath,
        voteTallyZkeyPath: testVoteTallyNonQvZkeyPath,
        pollJoiningWasm: testPollJoiningWasmPath,
        pollWitnessGenerator: testPollJoiningWitnessPath,
        rapidsnark: testRapidsnarkPath,
      });

      const pollContractAddress = testingClass.contractsData.polls![0];
      pollContract = PollFactory.connect(pollContractAddress, signer);
    });

    it("should have the correct coordinator public key set on chain", async () => {
      const onChainKey = await pollContract.coordinatorPublicKey();
      expect(onChainKey.x.toString()).to.eq(coordinatorKeypair.publicKey.raw[0].toString());
      expect(onChainKey.y.toString()).to.eq(coordinatorKeypair.publicKey.raw[1].toString());
    });

    it("should serialize and deserialize the coordinator private key to match the on chain key", async () => {
      const onChainKey = await pollContract.coordinatorPublicKey();

      const coordinatorPrivateKeySerialized = coordinatorKeypair.privateKey.serialize();
      const coordinatorPrivateKeyDeserialized = PrivateKey.deserialize(coordinatorPrivateKeySerialized);
      const coordinatorKeypairDeserialized = new Keypair(coordinatorPrivateKeyDeserialized);

      expect(coordinatorKeypairDeserialized.publicKey.raw[0].toString()).to.eq(onChainKey.x.toString());
      expect(coordinatorKeypairDeserialized.publicKey.raw[1].toString()).to.eq(onChainKey.y.toString());
    });

    it("should have a matching coordinator public key hash", async () => {
      const onChainKeyHash = await pollContract.coordinatorPublicKeyHash();
      const coordinatorPublicKeyHash = coordinatorKeypair.publicKey.hash();

      expect(onChainKeyHash.toString()).to.eq(coordinatorPublicKeyHash.toString());
    });
  });
});
