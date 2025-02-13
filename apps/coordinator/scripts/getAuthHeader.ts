import dotenv from "dotenv";
import { Wallet } from "ethers";

import path from "path";
import * as readline from "readline";
import url from "url";

import { getAuthorizationHeader } from "../tests/utils";

/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-shadow */
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
/* eslint-enable no-underscore-dangle */
/* eslint-enable @typescript-eslint/no-shadow */

dotenv.config({ path: [path.resolve(__dirname, "../.env"), path.resolve(__dirname, "../.env.example")] });

export async function getAuthHeader(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const askPrivateKey = () =>
    new Promise<string>((resolve) => {
      rl.question("Enter your private key to sign (only test keys): ", (answer) => {
        resolve(answer);
      });
    });
  const privateKey = await askPrivateKey();
  const wallet = new Wallet(privateKey);
  rl.close();

  const token = await getAuthorizationHeader(wallet);
  // eslint-disable-next-line no-console
  console.log(token);
}

getAuthHeader();
