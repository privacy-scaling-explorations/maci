import { MACI__factory as MACIFactory, TopupCredit__factory as TopupCreditFactory } from "maci-contracts";

import { type AirdropArgs, logError, logGreen, success, readContractAddress, contractExists, banner } from "../utils";

/**
 * Utility that can be used to get
 * topup credits airdropped
 * to the coordinator
 * @param AirdropArgs - The arguments for the airdrop command
 */
export const airdrop = async ({
  amount,
  contractAddress,
  pollId,
  maciAddress,
  signer,
  quiet = true,
}: AirdropArgs): Promise<void> => {
  banner(quiet);
  const network = await signer.provider?.getNetwork();

  // get the topup credit address from storage
  const topupCredit = readContractAddress("TopupCredit", network?.name);

  // we want to ensure that we have either the address stored
  // or that it was passed as a parameter
  if (!topupCredit && !contractAddress) {
    logError("Please provide an ERC20 contract address");
  }

  const ERC20Address = contractAddress || topupCredit;

  // check if the contract exists
  if (!(await contractExists(signer.provider!, ERC20Address))) {
    logError("Invalid ERC20 contract address");
  }

  // create the contract instance
  const tokenContract = TopupCreditFactory.connect(ERC20Address, signer);

  if (amount < 0) {
    logError("Invalid amount");
  }

  // try to get the tokens airdropped
  try {
    const tx = await tokenContract.airdrop(amount.toString(), {
      gasLimit: 1000000,
    });
    await tx.wait();

    logGreen(quiet, success(`Airdropped ${amount} credits to ${await signer.getAddress()}`));
  } catch (error) {
    logError((error as Error).message);
  }

  // if there is a poll id provided, we can pre-approve all of the tokens
  // so there is no need to do it afterwards
  if (pollId !== undefined) {
    const maciContractAddress = readContractAddress("MACI", network?.name)
      ? readContractAddress("MACI", network?.name)
      : maciAddress;

    if (!maciAddress) {
      logError("Please provide a MACI contract address");
    }

    const maciContract = MACIFactory.connect(maciContractAddress!, signer);

    const pollAddr = await maciContract.getPoll(pollId);
    try {
      const tx = await tokenContract.approve(pollAddr, amount, { gasLimit: 1000000 });
      await tx.wait();

      logGreen(quiet, success(`Approved ${pollAddr} to spend ${amount} credits`));
    } catch (error) {
      logError((error as Error).message);
    }
  }
};
