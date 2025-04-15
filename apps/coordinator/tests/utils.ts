import dotenv from "dotenv";
import { getBytes, hashMessage, type Signer } from "ethers";
import { createWalletClient, formatEther, Hex, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimismSepolia } from "viem/chains";

import fs from "fs";

import { ESupportedNetworks } from "../ts/common";
import { getPublicClient } from "../ts/common/accountAbstraction";
import { CryptoService } from "../ts/crypto/crypto.service";

dotenv.config();

/**
 * Sign a message with a wallet and encrypt it using the coordinator's public key
 * @param signer
 * @returns Authorization header
 */
export const getAuthorizationHeader = async (signer: Signer): Promise<string> => {
  const cryptoService = new CryptoService();
  const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
  const signature = await signer.signMessage("message");
  const digest = Buffer.from(getBytes(hashMessage("message"))).toString("hex");
  return `Bearer ${cryptoService.encrypt(publicKey, `${signature}:${digest}`)}`;
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
  const publicClient = getPublicClient(ESupportedNetworks.OPTIMISM_SEPOLIA);
  const balance = await publicClient.getBalance({ address });
  const balanceAsEther = formatEther(balance);
  if (balanceAsEther <= minimumValueOfEther) {
    const testAccount = privateKeyToAccount(process.env.TEST_PRIVATE_KEY! as Hex);
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
