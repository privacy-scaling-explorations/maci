import { genKeypair } from "maci-crypto";

import fs from "fs";
import path from "path";

async function generateMaciKeys(): Promise<void> {
  const { privKey, pubKey } = genKeypair();

  const keys = {
    privateKey: privKey.toString(),
    publicKey: pubKey.toString(),
  };

  const outputDir = path.resolve(__dirname, "..", "maci-keys");
  try {
    await fs.promises.access(outputDir);
  } catch (error) {
    await fs.promises.mkdir(outputDir, { recursive: true });
  }

  const outputFile = path.resolve(outputDir, "maci-keys.json");
  await fs.promises.writeFile(outputFile, JSON.stringify(keys, null, 2));
}

generateMaciKeys();
