import dotenv from "dotenv";

import { generateKeyPairSync } from "crypto";
import fs from "fs";
import path from "path";

dotenv.config({ path: [path.resolve(__dirname, "../.env"), path.resolve(__dirname, "../.env.example")] });

const MODULUS_LENGTH = 4096;

export async function generateRsaKeypair(): Promise<void> {
  const keypair = generateKeyPairSync("rsa", {
    modulusLength: MODULUS_LENGTH,
  });

  const publicKey = keypair.publicKey.export({ type: "pkcs1", format: "pem" });
  const privateKey = keypair.privateKey.export({ type: "pkcs1", format: "pem" });

  await Promise.all([
    fs.promises.writeFile(path.resolve(process.env.COORDINATOR_PUBLIC_KEY_PATH!), publicKey),
    fs.promises.writeFile(path.resolve(process.env.COORDINATOR_PRIVATE_KEY_PATH!), privateKey),
  ]);
}

generateRsaKeypair();
