import {
    deployConstantInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
    deployMaci,
    deployVerifier,
    deployTopupCredit as deployTopupCreditContract,
} from "maci-contracts";

import { readJSONFile, writeJSONFile } from "maci-common";
import { contractFilepath } from "./config";

import { DEFAULT_INITIAL_VOICE_CREDITS } from "./defaults";

const configureSubparser = (subparsers: any) => {
    const createParser = subparsers.addParser("create", { addHelp: true });

    createParser.addArgument(["-r", "--vk-registry"], {
        type: "string",
        help: "The VkRegistry contract address",
    });

    const vcGroup = createParser.addMutuallyExclusiveGroup();

    vcGroup.addArgument(["-c", "--initial-voice-credits"], {
        action: "store",
        type: "int",
        help: "Each user's initial voice credits. Default: 100",
    });

    vcGroup.addArgument(["-i", "--initial-vc-proxy"], {
        action: "store",
        type: "string",
        help: "If specified, deploys the MACI contract with this address as the initial voice credit proxy constructor argument. Otherwise, deploys a ConstantInitialVoiceCreditProxy contract with the above-specified value.",
    });

    createParser.addArgument(["-g", "--signup-gatekeeper"], {
        action: "store",
        type: "string",
        help: "If specified, deploys the MACI contract with this address as the signup gatekeeper constructor argument. Otherwise, deploys a gatekeeper contract which allows any address to sign up.",
    });

    createParser.addArgument(["-s", "--state-tree-depth"], {
        action: "store",
        type: "int",
        help: "The depth of the state tree",
    });
};

const create = async (args: any) => {
    let contractAddrs = readJSONFile(contractFilepath);
    if ((!contractAddrs || !contractAddrs["VkRegistry"]) && !args.vk_registry) {
        console.error("Error: vkRegistry contract address is empty");
        return;
    }

    const topupCreditContract = await deployTopupCreditContract();
    console.log("TopupCredit:", topupCreditContract.address);

    // Initial voice credit proxy contract
    const initialVoiceCreditProxy = args.initial_vc_proxy;

    // Whether we should deploy a ConstantInitialVoiceCreditProxy
    if (initialVoiceCreditProxy && args.initial_voice_credits) {
        console.error(
            "Error: only one of the following can be specified: the initial voice credit proxy or the amount of initial voice credits."
        );
        return;
    }

    let initialVoiceCreditProxyContractAddress: string;
    if (!initialVoiceCreditProxy) {
        // check if we have the amount of credits to set, or use the default
        const initialVoiceCredits = args.initial_voice_credits
            ? args.initial_voice_credits
            : DEFAULT_INITIAL_VOICE_CREDITS;

        // Deploy a ConstantInitialVoiceCreditProxy contract
        const c = await deployConstantInitialVoiceCreditProxy(
            initialVoiceCredits,
            false
        );
        initialVoiceCreditProxyContractAddress = c.address;
    } else {
        initialVoiceCreditProxyContractAddress = initialVoiceCreditProxy;
    }

    console.log(
        "Initial voice credit proxy",
        initialVoiceCreditProxyContractAddress
    );
    // Signup gatekeeper contract
    const signupGatekeeper = args.signup_gatekeeper;

    let signUpGatekeeperAddress: string;
    if (!signupGatekeeper) {
        // Deploy a FreeForAllGatekeeper contract
        const c = await deployFreeForAllSignUpGatekeeper(true);
        signUpGatekeeperAddress = c.address;
    } else {
        signUpGatekeeperAddress = signupGatekeeper;
    }

    console.log("Signup gatekeeper", signUpGatekeeperAddress);
    const verifierContract = await deployVerifier(true);
    console.log("Verifier", verifierContract.address);

    const vkRegistryContractAddress = args.vk_registry
        ? args.vk_registry
        : contractAddrs["VkRegistry"];

    const stateTreeDepth = args.state_tree_depth ? args.state_tree_depth : 10;
    console.log("VkRegistry", vkRegistryContractAddress);
    const {
        maciContract,
        stateAqContract,
        pollFactoryContract,
        poseidonAddrs,
    } = await deployMaci(
        signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress,
        verifierContract.address,
        vkRegistryContractAddress,
        topupCreditContract.address,
        stateTreeDepth
    );

    console.log("MACI:", maciContract.address);

    contractAddrs["InitialVoiceCreditProxy"] =
        initialVoiceCreditProxyContractAddress;
    contractAddrs["SignUpGatekeeper"] = signUpGatekeeperAddress;
    contractAddrs["Verifier"] = verifierContract.address;
    contractAddrs["MACI"] = maciContract.address;
    contractAddrs["StateAq"] = stateAqContract.address;
    contractAddrs["PollFactory"] = pollFactoryContract.address;
    contractAddrs["TopupCredit"] = topupCreditContract.address;
    contractAddrs["PoseidonT3"] = poseidonAddrs[0];
    contractAddrs["PoseidonT4"] = poseidonAddrs[1];
    contractAddrs["PoseidonT5"] = poseidonAddrs[2];
    contractAddrs["PoseidonT6"] = poseidonAddrs[3];
    writeJSONFile(contractFilepath, contractAddrs);
};

export { create, configureSubparser };
