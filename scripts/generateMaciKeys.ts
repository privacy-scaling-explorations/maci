import { genKeypair } from "maci-crypto";

import { promises as fs } from "fs";
import * as path from "path";

async function generateMaciKeys(): Promise<void> {
  const { privKey, pubKey } = genKeypair();

  const keys = {
    privateKey: privKey.toString(),
    publicKey: pubKey.toString(),
  };

  const outputDir = path.resolve(__dirname, "..", "maci-keys");
  try {
    await fs.access(outputDir);
  } catch (error) {
    await fs.mkdir(outputDir, { recursive: true });
  }

  const outputFile = path.resolve(outputDir, "maci-keys.json");
  await fs.writeFile(outputFile, JSON.stringify(keys, null, 2));
}

generateMaciKeys();
