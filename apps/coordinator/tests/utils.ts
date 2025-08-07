import { ESupportedChains } from "@maci-protocol/sdk";
import dotenv from "dotenv";
import { getBytes, hashMessage, type Signer } from "ethers";
import { createWalletClient, formatEther, Hex, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimismSepolia } from "viem/chains";

import fs from "fs";

import { getPublicClient } from "../ts/common/accountAbstraction";
import { CryptoService } from "../ts/crypto/crypto.service";

dotenv.config();

/**
 * Encrypt a message using the coordinator's public key
 * @param message to encrypt
 * @returns encrypted message (ciphertext)
 */
export const encryptWithCoordinatorRSAPublicKey = async (message: string): Promise<string> => {
  const cryptoService = new CryptoService();
  const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
  return cryptoService.encrypt(publicKey, message);
};

/**
 * Sign a message with a wallet and encrypt it using the coordinator's public key
 * @param signer
 * @returns Authorization header
 */
export const getAuthorizationHeader = async (signer: Signer): Promise<string> => {
  const signature = await signer.signMessage("message");
  const digest = Buffer.from(getBytes(hashMessage("message"))).toString("hex");
  const encrypted = await encryptWithCoordinatorRSAPublicKey(`${signature}:${digest}`);
  return `Bearer ${encrypted}`;
};

/**
 * Reloads with ETH in case the smart account is out of gas (less than 0.05)
 * @param sessionKeyAddress
 */
export const rechargeGasIfNeeded = async (
  address: Hex,
  minimumValueOfEther: string,
  valueToSendOfEther: string,
): Promise<void> => {
  const publicClient = await getPublicClient(ESupportedChains.OptimismSepolia);
  const balance = await publicClient.getBalance({ address });
  const balanceAsEther = formatEther(balance);

  if (balanceAsEther <= minimumValueOfEther) {
    const testAccount = privateKeyToAccount(process.env.PRIVATE_KEY! as Hex);
    const walletClient = createWalletClient({
      chain: optimismSepolia,
      transport: http(),
    });

    await walletClient.sendTransaction({
      account: testAccount,
      to: address,
      value: parseEther(valueToSendOfEther),
    });
  }
};
