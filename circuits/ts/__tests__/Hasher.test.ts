import { getSignal } from "./utils";

import { PCommand, Keypair } from "maci-domainobjs";
const tester = require("circom_tester").wasm;

import { stringifyBigInts, genRandomSalt, sha256Hash, hashLeftRight, hash13, hash5, hash4, hash3 } from "maci-crypto";
import path from "path";
import { expect } from "chai";

describe("Poseidon hash circuits", function () {
  this.timeout(30000);

  let circuit: any;

  describe("SHA256", () => {
    describe("Sha256HashLeftRight", () => {
      before(async () => {
        const circuitPath = path.join(__dirname, "../../circom/test", `sha256HashLeftRight_test.circom`);
        circuit = await tester(circuitPath);
      });

      it("correctly hashes two random values", async () => {
        const left = genRandomSalt();
        const right = genRandomSalt();

        const circuitInputs = stringifyBigInts({ left, right });

        const witness = await circuit.calculateWitness(circuitInputs, true);
        await circuit.checkConstraints(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = sha256Hash([left, right]);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Sha256Hasher4", () => {
      before(async () => {
        const circuitPath = path.join(__dirname, "../../circom/test", `sha256Hasher4_test.circom`);
        circuit = await tester(circuitPath);
      });

      it("correctly hashes 4 random values", async () => {
        const preImages: any = [];
        for (let i = 0; i < 4; i++) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = stringifyBigInts({
          in: preImages,
        });

        const witness = await circuit.calculateWitness(circuitInputs, true);
        await circuit.checkConstraints(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = sha256Hash(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Sha256Hasher6", () => {
      before(async () => {
        const circuitPath = path.join(__dirname, "../../circom/test", `sha256Hasher6_test.circom`);
        circuit = await tester(circuitPath);
      });
      it("correctly hashes 6 random values", async () => {
        const preImages: any = [];
        for (let i = 0; i < 6; i++) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = stringifyBigInts({
          in: preImages,
        });

        const witness = await circuit.calculateWitness(circuitInputs, true);
        await circuit.checkConstraints(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = sha256Hash(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });
  });

  describe("Poseidon", () => {
    describe("Hasher5", () => {
      before(async () => {
        const circuitPath = path.join(__dirname, "../../circom/test", `hasher5_test.circom`);
        circuit = await tester(circuitPath);
      });
      it("correctly hashes 5 random values", async () => {
        const preImages: any = [];
        for (let i = 0; i < 5; i++) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = stringifyBigInts({
          in: preImages,
        });

        const witness = await circuit.calculateWitness(circuitInputs, true);
        await circuit.checkConstraints(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hash5(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Hasher4", () => {
      before(async () => {
        const circuitPath = path.join(__dirname, "../../circom/test", `hasher4_test.circom`);
        circuit = await tester(circuitPath);
      });
      it("correctly hashes 4 random values", async () => {
        const preImages: any = [];
        for (let i = 0; i < 4; i++) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = stringifyBigInts({
          in: preImages,
        });

        const witness = await circuit.calculateWitness(circuitInputs, true);
        await circuit.checkConstraints(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hash4(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Hasher3", () => {
      before(async () => {
        const circuitPath = path.join(__dirname, "../../circom/test", `hasher3_test.circom`);
        circuit = await tester(circuitPath);
      });

      it("correctly hashes 3 random values", async () => {
        const preImages: any = [];
        for (let i = 0; i < 3; i++) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = stringifyBigInts({
          in: preImages,
        });

        const witness = await circuit.calculateWitness(circuitInputs, true);
        await circuit.checkConstraints(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hash3(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Hasher13", () => {
      before(async () => {
        const circuitPath = path.join(__dirname, "../../circom/test", `hasher13_test.circom`);
        circuit = await tester(circuitPath);
      });
      it("correctly hashes 13 random values", async () => {
        const preImages: any = [];
        for (let i = 0; i < 13; i++) {
          preImages.push(genRandomSalt());
        }
        const circuitInputs = stringifyBigInts({
          in: preImages,
        });

        const witness = await circuit.calculateWitness(circuitInputs, true);
        await circuit.checkConstraints(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hash13(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("HashLeftRight", () => {
      before(async () => {
        const circuitPath = path.join(__dirname, "../../circom/test", `hashleftright_test.circom`);
        circuit = await tester(circuitPath);
      });
      it("correctly hashes two random values", async () => {
        const left = genRandomSalt();
        const right = genRandomSalt();

        const circuitInputs = stringifyBigInts({ left, right });

        const witness = await circuit.calculateWitness(circuitInputs, true);
        await circuit.checkConstraints(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hashLeftRight(left, right);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });
  });

  describe("MessageHasher", () => {
    before(async () => {
      const circuitPath = path.join(__dirname, "../../circom/test", `messageHasher_test.circom`);
      circuit = await tester(circuitPath);
    });
    it("correctly hashes a message", async () => {
      const k = new Keypair();
      const random50bitBigInt = (): bigint => {
        return ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(genRandomSalt().toString());
      };

      const command: PCommand = new PCommand(
        random50bitBigInt(),
        k.pubKey,
        random50bitBigInt(),
        random50bitBigInt(),
        random50bitBigInt(),
        random50bitBigInt(),
        genRandomSalt(),
      );

      const { privKey } = new Keypair();
      const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, k.pubKey);
      const signature = command.sign(privKey);
      const message = command.encrypt(signature, ecdhSharedKey);
      const messageHash = message.hash(k.pubKey);
      const circuitInputs = stringifyBigInts({
        in: message.asCircuitInputs(),
        encPubKey: k.pubKey.asCircuitInputs(),
      });
      const witness = await circuit.calculateWitness(circuitInputs, true);
      await circuit.checkConstraints(witness);
      const output = await getSignal(circuit, witness, "hash");
      expect(output.toString()).to.be.eq(messageHash.toString());
    });
  });
});
