import dotenv from "dotenv";
import { generateKeyPairSync } from "crypto";
import fs from "fs";
import path from "path";
import url from "url";

/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-shadow */
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
/* eslint-enable no-underscore-dangle */
/* eslint-enable @typescript-eslint/no-shadow */

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MODULUS_LENGTH = 4096;

export async function generateRsaKeypair(): Promise<void> {
  const publicKeyPath = process.env.COORDINATOR_PUBLIC_KEY_PATH;
  const privateKeyPath = process.env.COORDINATOR_PRIVATE_KEY_PATH;

  if (!publicKeyPath || !privateKeyPath) {
    throw new Error("Public or private key path is not set in environment variables.");
  }

  try {
    const keypair = generateKeyPairSync("rsa", { modulusLength: MODULUS_LENGTH });
    const publicKey = keypair.publicKey.export({ type: "pkcs1", format: "pem" });
    const privateKey = keypair.privateKey.export({ type: "pkcs1", format: "pem" });

    await Promise.all([
      fs.promises.writeFile(publicKeyPath, publicKey),
      fs.promises.writeFile(privateKeyPath, privateKey),
    ]);
  } catch (error) {
    console.error("Error generating RSA keypair:", error);
  }
}

generateRsaKeypair();
