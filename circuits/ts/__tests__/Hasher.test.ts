import { expect } from "chai";
import { type WitnessTester } from "circomkit";
import { genRandomSalt, sha256Hash, hash5, hash4, hash3, hash2 } from "maci-crypto";
import { PCommand, Keypair } from "maci-domainobjs";

import { getSignal, circomkitInstance } from "./utils/utils";

describe("Poseidon hash circuits", function test() {
  this.timeout(30000);

  describe("SHA256", () => {
    describe("Sha256Hasher", () => {
      let circuit: WitnessTester<["in"], ["hash"]>;

      it("correctly hashes 2 random values in order", async () => {
        const n = 2;

        circuit = await circomkitInstance.WitnessTester("sha256hasher", {
          file: "hashers",
          template: "Sha256Hasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
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

      it("correctly hashes 3 random values", async () => {
        const n = 3;

        circuit = await circomkitInstance.WitnessTester("sha256hasher", {
          file: "hashers",
          template: "Sha256Hasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
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

      it("correctly hashes 4 random values", async () => {
        const n = 4;

        circuit = await circomkitInstance.WitnessTester("sha256hasher", {
          file: "hashers",
          template: "Sha256Hasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
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

      it("correctly hashes 5 random values", async () => {
        const n = 5;

        circuit = await circomkitInstance.WitnessTester("sha256hasher", {
          file: "hashers",
          template: "Sha256Hasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
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

      it("correctly hashes 6 random values", async () => {
        const n = 6;

        circuit = await circomkitInstance.WitnessTester("sha256hasher", {
          file: "hashers",
          template: "Sha256Hasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
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

      it("correctly hashes 10 random values", async () => {
        const n = 10;

        circuit = await circomkitInstance.WitnessTester("sha256hasher", {
          file: "hashers",
          template: "Sha256Hasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
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
    describe("PoseidonHasher", () => {
      let circuit: WitnessTester<["inputs"], ["out"]>;

      it("correctly hashes 2 random values in order", async () => {
        const n = 2;

        circuit = await circomkitInstance.WitnessTester("poseidonHasher", {
          file: "hashers",
          template: "PoseidonHasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = {
          inputs: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "out");

        const outputJS = hash2(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });

      it("correctly hashes 3 random values", async () => {
        const n = 3;

        circuit = await circomkitInstance.WitnessTester("poseidonHasher", {
          file: "hashers",
          template: "PoseidonHasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = {
          inputs: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "out");

        const outputJS = hash3(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });

      it("correctly hashes 4 random values", async () => {
        const n = 4;

        circuit = await circomkitInstance.WitnessTester("poseidonHasher", {
          file: "hashers",
          template: "PoseidonHasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = {
          inputs: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "out");

        const outputJS = hash4(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });

      it("correctly hashes 5 random values", async () => {
        const n = 5;

        circuit = await circomkitInstance.WitnessTester("poseidonHasher", {
          file: "hashers",
          template: "PoseidonHasher",
          params: [n],
        });

        const preImages: bigint[] = [];
        for (let i = 0; i < n; i += 1) {
          preImages.push(genRandomSalt());
        }

        const circuitInputs = {
          inputs: preImages,
        };

        const witness = await circuit.calculateWitness(circuitInputs);
        await circuit.expectConstraintPass(witness);
        const output = await getSignal(circuit, witness, "out");

        const outputJS = hash5(preImages);

        expect(output.toString()).to.be.eq(outputJS.toString());
      });
    });
  });

  describe("MessageHasher", () => {
    let circuit: WitnessTester<["in", "encPubKey"], ["hash"]>;

    before(async () => {
      circuit = await circomkitInstance.WitnessTester("messageHasher", {
        file: "hashers",
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
