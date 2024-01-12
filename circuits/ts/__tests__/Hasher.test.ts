import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { genRandomSalt, sha256Hash, hashLeftRight, hash13, hash5, hash4, hash3 } from "maci-crypto";
import { PCommand, Keypair } from "maci-domainobjs";

import { getSignal, circomkitInstance } from "./utils/utils";

describe("Poseidon hash circuits", function test() {
  this.timeout(30000);

  describe("SHA256", () => {
    describe("Sha256HashLeftRight", () => {
      let circuit: WitnessTester<["left", "right"], ["hash"]>;

      before(async () => {
        circuit = await circomkitInstance.WitnessTester("sha256HashLeftRight", {
          file: "hasherSha256",
          template: "Sha256HashLeftRight",
        });
      });

      it("should correctly hash two random values", async () => {
        const left = genRandomSalt();
        const right = genRandomSalt();

        const circuitInputs = { left, right };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = sha256Hash([left, right]);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Sha256Hasher4", () => {
      let circuit: WitnessTester<["in"], ["hash"]>;

      before(async () => {
        circuit = await circomkitInstance.WitnessTester("sha256Hasher4", {
          file: "hasherSha256",
          template: "Sha256Hasher4",
        });
      });

      it("should correctly hash 4 random values", async () => {
        const preImages: bigint[] = [];
        for (let i = 0; i < 4; i += 1) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = {
          in: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = sha256Hash(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Sha256Hasher6", () => {
      let circuit: WitnessTester<["in"], ["hash"]>;

      before(async () => {
        circuit = await circomkitInstance.WitnessTester("sha256Hasher6", {
          file: "hasherSha256",
          template: "Sha256Hasher6",
        });
      });

      it("should correctly hash 6 random values", async () => {
        const preImages: bigint[] = [];
        for (let i = 0; i < 6; i += 1) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = {
          in: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = sha256Hash(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });
  });

  describe("Poseidon", () => {
    describe("Hasher5", () => {
      let circuit: WitnessTester<["in"], ["hash"]>;

      before(async () => {
        circuit = await circomkitInstance.WitnessTester("hasher5", {
          file: "hasherPoseidon",
          template: "Hasher5",
        });
      });

      it("correctly hashes 5 random values", async () => {
        const preImages: bigint[] = [];
        for (let i = 0; i < 5; i += 1) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = {
          in: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hash5(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Hasher4", () => {
      let circuit: WitnessTester<["in"], ["hash"]>;

      before(async () => {
        circuit = await circomkitInstance.WitnessTester("hasher4", {
          file: "hasherPoseidon",
          template: "Hasher4",
        });
      });

      it("correctly hashes 4 random values", async () => {
        const preImages: bigint[] = [];
        for (let i = 0; i < 4; i += 1) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = {
          in: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hash4(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Hasher3", () => {
      let circuit: WitnessTester<["in"], ["hash"]>;

      before(async () => {
        circuit = await circomkitInstance.WitnessTester("hasher3", {
          file: "hasherPoseidon",
          template: "Hasher3",
        });
      });

      it("correctly hashes 3 random values", async () => {
        const preImages: bigint[] = [];
        for (let i = 0; i < 3; i += 1) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = {
          in: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hash3(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("Hasher13", () => {
      let circuit: WitnessTester<["in"], ["hash"]>;

      before(async () => {
        circuit = await circomkitInstance.WitnessTester("hasher13", {
          file: "hasherPoseidon",
          template: "Hasher13",
        });
      });

      it("should correctly hash 13 random values", async () => {
        const preImages: bigint[] = [];
        for (let i = 0; i < 13; i += 1) {
          preImages.push(genRandomSalt());
        }
        const circuitInputs = {
          in: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hash13(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });

    describe("HashLeftRight", () => {
      let circuit: WitnessTester<["left", "right"], ["hash"]>;

      before(async () => {
        circuit = await circomkitInstance.WitnessTester("hashLeftRight", {
          file: "hasherPoseidon",
          template: "HashLeftRight",
        });
      });

      it("should correctly hash two random values", async () => {
        const left = genRandomSalt();
        const right = genRandomSalt();

        const circuitInputs = { left, right };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "hash");

        const outputJS = hashLeftRight(left, right);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });

      it("should produce consistent results", async () => {
        const left = genRandomSalt();
        const right = genRandomSalt();

        const circuitInputs = { left, right };

        let witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "hash");

        witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output2 = await getSignal(circuit, witness, "hash");

        expect(output.toString()).to.be.eq(output2.toString());
      });
    });
  });

  describe("MessageHasher", () => {
    let circuit: WitnessTester<["in", "encPubKey"], ["hash"]>;

    before(async () => {
      circuit = await circomkitInstance.WitnessTester("messageHasher", {
        file: "messageHasher",
        template: "MessageHasher",
      });
    });

    it("should correctly hash a message", async () => {
      const k = new Keypair();
      const random50bitBigInt = (): bigint =>
        // eslint-disable-next-line no-bitwise
        ((BigInt(1) << BigInt(50)) - BigInt(1)) & BigInt(genRandomSalt().toString());

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
      const circuitInputs = {
        in: message.asCircuitInputs(),
        encPubKey: k.pubKey.asCircuitInputs() as unknown as [bigint, bigint],
      };
      const witness = await circuit.calculateWitness(circuitInputs);
      await circuit.expectConstraintPass(witness);
      const output = await getSignal(circuit, witness, "hash");
      expect(output.toString()).to.be.eq(messageHash.toString());
    });
  });
});
