import { ZeroAddress } from "ethers";
import { Keypair } from "maci-domainobjs";

const keypair = new Keypair();

export const defaultSaveMessagesArgs = {
  maciContractAddress: ZeroAddress,
  poll: 0,
  messages: [
    {
      data: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      publicKey: keypair.pubKey.serialize(),
    },
  ],
};
