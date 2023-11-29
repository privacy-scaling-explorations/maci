import * as ethers from "ethers";
import * as fs from "fs";

import { genMaciStateFromContract } from "maci-contracts";

import { validateEthAddress, contractExists, promptPwd } from "./utils";

import { DEFAULT_ETH_PROVIDER } from "./defaults";

import { readJSONFile } from "maci-common";
import { contractFilepath } from "./config";
import { Keypair, PrivKey } from "maci-domainobjs";

const configureSubparser = (subparsers: any) => {
  const parser = subparsers.addParser("genLocalState", { addHelp: true });

  const maciPrivkeyGroup = parser.addMutuallyExclusiveGroup({ required: true });

  maciPrivkeyGroup.addArgument(["-dsk", "--prompt-for-maci-privkey"], {
    action: "storeTrue",
    help: "Whether to prompt for your serialized MACI private key",
  });

  maciPrivkeyGroup.addArgument(["-sk", "--privkey"], {
    action: "store",
    type: "string",
    help: "Your serialized MACI private key",
  });

  parser.addArgument(["-e", "--eth-provider"], {
    action: "store",
    type: "string",
    help: `A connection string to an Ethereum provider. Default: ${DEFAULT_ETH_PROVIDER}`,
  });

  parser.addArgument(["-x", "--maci-contract"], {
    required: false,
    type: "string",
    help: "The MACI contract address",
  });

  parser.addArgument(["-i", "--poll-id"], {
    required: false,
    type: "int",
    help: "The Poll ID",
  });

  parser.addArgument(["-p", "--poll-contract"], {
    required: false,
    type: "string",
    help: "The Poll contract address",
  });

  parser.addArgument(["-b", "--start-block"], {
    type: "int",
    help: "The block number at which the contract was deployed",
  });

  parser.addArgument(["-f", "--end-block"], {
    required: false,
    type: "int",
    help: "The last block number to fetch logs from. If not specified, the current block number is used",
  });

  parser.addArgument(["-n", "--num-blocks-per-request"], {
    required: true,
    type: "int",
    help: "The number of logs to fetch per RPC request",
  });

  parser.addArgument(["-o", "--output"], {
    required: true,
    type: "string",
    help: "The output file for signups and messages",
  });

  parser.addArgument(["-s", "--sleep"], {
    type: "int",
    help: "The number of milliseconds to sleep between each RPC request to avoid getting rate limited",
  });
};

const genLocalState = async (args: any) => {
  // read the contract addresses from the config file
  const contractAddrs = readJSONFile(contractFilepath);

  const pollId = args.poll_id ? args.poll_id : 0;
  const pollArtifactName = `Poll-${pollId}`;

  // ensure we have at least one address
  if (
    (!contractAddrs || !contractAddrs["MACI"] || !contractAddrs[pollArtifactName]) &&
    !args.maci_contract &&
    !args.poll_contract
  ) {
    console.error(
      "Error: If no contract address is stored locally, please specify the poll id, the maci contract address and the poll address",
    );
    return;
  }
  // prioritize cli flag arg
  const maciAddress = args.maci_contract ? args.maci_contract : contractAddrs["MACI"];
  const pollAddress = args.poll_contract ? args.poll_contract : contractAddrs[pollArtifactName];

  // validate it's a valid eth address
  if (!validateEthAddress(maciAddress)) {
    console.error(
      "Error: invalid MACI contract address. Ensure the address starts with '0x' followed by the 40 hexadecimal characters",
    );
    return;
  }

  if (!validateEthAddress(pollAddress)) {
    console.error(
      "Error: invalid Poll contract address. Ensure the address starts with '0x' followed by the 40 hexadecimal characters",
    );
    return;
  }

  // Ethereum provider
  const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER;

  const provider = new ethers.providers.JsonRpcProvider(ethProvider);

  if (!(await contractExists(provider, maciAddress))) {
    console.error("Error: there is no MACI contract deployed at the specified address");
    return;
  }

  if (!(await contractExists(provider, pollAddress))) {
    console.error("Error: there is no Poll contract deployed at the specified address");
    return;
  }

  // The coordinator's MACI private key
  let serializedPrivkey: string;
  if (args.prompt_for_maci_privkey) {
    serializedPrivkey = await promptPwd("Your MACI private key");
  } else {
    serializedPrivkey = args.privkey;
  }

  if (!PrivKey.isValidSerializedPrivKey(serializedPrivkey)) {
    console.error("Error: invalid MACI private key");
    return;
  }

  const maciPrivkey = PrivKey.unserialize(serializedPrivkey);
  const coordinatorKeypair = new Keypair(maciPrivkey);

  // calculate the end block number
  const endBlockNumber = args.end_block ? args.end_block : await provider.getBlockNumber();

  console.log("Fetching signup and publish message logs");
  // some rpc endpoint like bsc chain has limitation to retreive history logs
  let fromBlock = args.start_block ? args.start_block : 0;
  const txHash = args.transaction_hash;
  if (txHash) {
    const txn = await provider.getTransaction(txHash);
    fromBlock = txn.blockNumber;
  }
  console.log(`Fetching logs from ${fromBlock} till ${endBlockNumber} and generating the offline maci state`);

  const maciState = await genMaciStateFromContract(
    provider,
    maciAddress,
    coordinatorKeypair,
    pollId,
    fromBlock,
    args.blocks_per_batch,
    args.end_block,
    args.sleep,
  );

  // write the state to a file
  const serializedState = maciState.toJSON();
  fs.writeFileSync(args.output, JSON.stringify(serializedState, null, 4));
};

export { genLocalState, configureSubparser };
