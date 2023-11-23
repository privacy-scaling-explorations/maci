import * as fs from "fs";
import * as shelljs from "shelljs";
import * as path from "path";

import { contractExists } from "./utils";

import { compareVks } from "./setVerifyingKeys";

import { getDefaultSigner, parseArtifact } from "maci-contracts";

import { extractVk } from "maci-circuits";
import { readJSONFile } from "maci-common";
import { VerifyingKey } from "maci-domainobjs";

import { contractFilepath } from "./config";

const { ethers } = require("hardhat");

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser("checkVerifyingKey", { addHelp: true });

    parser.addArgument(["-x", "--contract"], {
        type: "string",
        help: "The MACI contract address",
    });

    parser.addArgument(["-s", "--state-tree-depth"], {
        action: "store",
        type: "int",
        required: true,
        help: "The state tree depth for the first set of verifying keys. ",
    });

    parser.addArgument(["-i", "--int-state-tree-depth"], {
        action: "store",
        type: "int",
        required: true,
        help: "The intermediate state tree depth for vote tallying. ",
    });

    parser.addArgument(["-m", "--msg-tree-depth"], {
        action: "store",
        type: "int",
        required: true,
        help: "The message tree depth for message processing. ",
    });

    parser.addArgument(["-v", "--vote-option-tree-depth"], {
        action: "store",
        type: "int",
        required: true,
        help: "The vote option tree depth. ",
    });

    parser.addArgument(["-b", "--msg-batch-depth"], {
        action: "store",
        type: "int",
        required: true,
        help: "The batch depth for message processing. ",
    });

    parser.addArgument(["-p", "--process-messages-zkey"], {
        action: "store",
        type: "string",
        required: true,
        help: "The .zkey file for the message processing circuit. ",
    });

    parser.addArgument(["-t", "--tally-votes-zkey"], {
        action: "store",
        type: "string",
        required: true,
        help: "The .zkey file for the vote tallying circuit. ",
    });
};

const checkVerifyingKey = async (args: any) => {
    let contractAddrs = readJSONFile(contractFilepath);
    if ((!contractAddrs || !contractAddrs["MACI"]) && !args.maci_address) {
        console.error("Error: MACI contract address is empty");
        return;
    }

    const maciAddress = args.maci_address
        ? args.maci_address
        : contractAddrs["MACI"];
    const stateTreeDepth = args.state_tree_depth;
    const intStateTreeDepth = args.int_state_tree_depth;
    const msgTreeDepth = args.msg_tree_depth;
    const voteOptionTreeDepth = args.vote_option_tree_depth;
    const msgBatchDepth = args.msg_batch_depth;

    const pmZkeyFile = path.resolve(args.process_messages_zkey);
    const tvZkeyFile = path.resolve(args.tally_votes_zkey);

    const processVk: VerifyingKey = VerifyingKey.fromObj(
        await extractVk(pmZkeyFile)
    );
    const tallyVk: VerifyingKey = VerifyingKey.fromObj(
        await extractVk(tvZkeyFile)
    );

    const signer = await getDefaultSigner();
    if (!(await contractExists(signer.provider, maciAddress))) {
        console.error(
            "Error: there is no contract deployed at the specified address"
        );
        return;
    }

    const [maciContractAbi] = parseArtifact("MACI");
    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        signer
    );

    try {
        console.log("Retrieving verifying key registry...");
        const vkRegistryAddress = await maciContract.vkRegistry();
        const [vkRegistryAbi] = parseArtifact("VkRegistry");
        const vkRegistryContract = new ethers.Contract(
            vkRegistryAddress,
            vkRegistryAbi,
            signer
        );

        const messageBatchSize = 5 ** msgBatchDepth;

        console.log("Retrieving processes verifying key from contract...");
        const processVkOnChain = await vkRegistryContract.getProcessVk(
            stateTreeDepth,
            msgTreeDepth,
            voteOptionTreeDepth,
            messageBatchSize
        );

        console.log("Retrieving tally verifying key from contract...");
        const tallyVkOnChain = await vkRegistryContract.getTallyVk(
            stateTreeDepth,
            intStateTreeDepth,
            voteOptionTreeDepth
        );

        if (!compareVks(processVk, processVkOnChain)) {
            console.error("Error: processVk mismatch");
            return;
        }

        if (!compareVks(tallyVk, tallyVkOnChain)) {
            console.error("Error: tallyVk mismatch");
            return;
        }
    } catch (e) {
        console.error(e.message);
        return;
    }

    console.log("Success: zkey files match the keys in the registry");
};

export { checkVerifyingKey, configureSubparser };
