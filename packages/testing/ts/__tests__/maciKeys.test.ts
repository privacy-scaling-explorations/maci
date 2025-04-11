import { genPrivKey, genPubKey } from "@maci-protocol/crypto";
import { Keypair, PrivKey, PubKey } from "@maci-protocol/domainobjs";
import { Poll__factory as PollFactory, type Poll, getDefaultSigner } from "@maci-protocol/sdk";
import { expect } from "chai";

import type { Signer } from "ethers";

import {
  pollJoinedZkey,
  pollJoiningZkey,
  pollWasm,
  pollWitgen,
  processMessagesZkeyPathNonQv,
  rapidsnark,
  tallyVotesZkeyPathNonQv,
} from "../constants";
import { TestingClass } from "../testingClass";

describe("integration tests private/public/keypair", () => {
  describe("crypto/domainobjs", () => {
    it("should serialize and deserialize a private key correctly", () => {
      const privateKeyCrypto = genPrivKey();

      const privKeyDomainobjs = new PrivKey(privateKeyCrypto);
      const privKeyDomainobjsSerialized = privKeyDomainobjs.serialize();

      const privKeyDomainobjsDeserialized = PrivKey.deserialize(privKeyDomainobjsSerialized);

      expect(privKeyDomainobjsDeserialized.rawPrivKey.toString()).to.eq(privateKeyCrypto.toString());
    });

    it("should serialize and deserialize a public key correctly", () => {
      const privateKeyCrypto = genPrivKey();

      const publicKeyCrypto = genPubKey(privateKeyCrypto);

      const pubKeyDomainobjs = new PubKey(publicKeyCrypto);

      const pubKeyDomainobjsSerialized = pubKeyDomainobjs.serialize();
      const pubKeyDomainobjsDeserialized = PubKey.deserialize(pubKeyDomainobjsSerialized);

      expect(pubKeyDomainobjsDeserialized.rawPubKey[0].toString()).to.eq(publicKeyCrypto[0].toString());
      expect(pubKeyDomainobjsDeserialized.rawPubKey[1].toString()).to.eq(publicKeyCrypto[1].toString());
    });

    it("should serialize and deserialize a private key correct after serializing as contract params", () => {
      const privateKeyCrypto = genPrivKey();

      const privKeyDomainobjs = new PrivKey(privateKeyCrypto);
      const keypairDomainobjs = new Keypair(privKeyDomainobjs);

      const pubKeyDomainobjsAsContractParam = keypairDomainobjs.pubKey.asContractParam();

      const privKeyDomainobjsSerialized = privKeyDomainobjs.serialize();

      const privKeyDomainobjsDeserialized = PrivKey.deserialize(privKeyDomainobjsSerialized);
      const keypairDomainobjsDeserialized = new Keypair(privKeyDomainobjsDeserialized);

      expect(keypairDomainobjsDeserialized.pubKey.rawPubKey[0].toString()).to.eq(
        pubKeyDomainobjsAsContractParam.x.toString(),
      );
      expect(keypairDomainobjsDeserialized.pubKey.rawPubKey[1].toString()).to.eq(
        pubKeyDomainobjsAsContractParam.y.toString(),
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
        pollJoiningZkeyPath: pollJoiningZkey,
        pollJoinedZkeyPath: pollJoinedZkey,
        processMessagesZkeyPath: processMessagesZkeyPathNonQv,
        tallyVotesZkeyPath: tallyVotesZkeyPathNonQv,
        pollWasm,
        pollWitgen,
        rapidsnark,
      });

      const pollContractAddress = testingClass.contractsData.polls![0];
      pollContract = PollFactory.connect(pollContractAddress, signer);
    });

    it("should have the correct coordinator pub key set on chain", async () => {
      const onChainKey = await pollContract.coordinatorPubKey();
      expect(onChainKey.x.toString()).to.eq(coordinatorKeypair.pubKey.rawPubKey[0].toString());
      expect(onChainKey.y.toString()).to.eq(coordinatorKeypair.pubKey.rawPubKey[1].toString());
    });

    it("should serialize and deserialize the coordinator private key to match the on chain key", async () => {
      const onChainKey = await pollContract.coordinatorPubKey();

      const coordinatorPrivKeySerialized = coordinatorKeypair.privKey.serialize();
      const coordinatorPrivKeyDeserialized = PrivKey.deserialize(coordinatorPrivKeySerialized);
      const coordinatorKeypairDeserialized = new Keypair(coordinatorPrivKeyDeserialized);

      expect(coordinatorKeypairDeserialized.pubKey.rawPubKey[0].toString()).to.eq(onChainKey.x.toString());
      expect(coordinatorKeypairDeserialized.pubKey.rawPubKey[1].toString()).to.eq(onChainKey.y.toString());
    });

    it("should have a matching coordinator public key hash", async () => {
      const onChainKeyHash = await pollContract.coordinatorPubKeyHash();
      const coordinatorPubKeyHash = coordinatorKeypair.pubKey.hash();

      expect(onChainKeyHash.toString()).to.eq(coordinatorPubKeyHash.toString());
    });
  });
});
