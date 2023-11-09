import {
    deploy,
    deployPoll,
    deployVkRegistryContract, 
    genProofs, 
    mergeMessages, 
    mergeSignups, 
    proveOnChain, 
    publish, 
    setVerifyingKeys, 
    signup, 
    timeTravel,
    verify
} from "../ts/commands"
import {
    DeployPollArgs,
    DeployVkRegistryArgs, 
    GenProofsArgs, 
    MergeMessagesArgs, 
    MergeSignupsArgs, 
    ProveOnChainArgs, 
    PublishArgs, 
    SetVerifyingKeysArgs, 
    SignUpArgs, 
    TimeTravelArgs,
    VerifyArgs
} from "../ts/utils"
import { 
    INT_STATE_TREE_DEPTH, 
    MSG_BATCH_DEPTH, 
    MSG_TREE_DEPTH, 
    STATE_TREE_DEPTH, 
    VOTE_OPTION_TREE_DEPTH 
} from "./constants"
import {
    homedir
} from "os"
import { cleanSubsidy } from "./utils"
import { isArm } from "maci-circuits"

describe("Subsidy tests", function() {
    this.timeout(900000)

    const useWasm = isArm() 

    const deployVkRegistryArgs: DeployVkRegistryArgs = { quiet: true }

    const setVerifyingKeysArgs: SetVerifyingKeysArgs = {
        quiet: true,
        stateTreeDepth: STATE_TREE_DEPTH,
        intStateTreeDepth: INT_STATE_TREE_DEPTH,
        messageTreeDepth: MSG_TREE_DEPTH,
        voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
        messageBatchDepth: MSG_BATCH_DEPTH,
        processMessagesZkeyPath: "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
        tallyVotesZkeyPath: "./zkeys/TallyVotes_10-1-2_test.0.zkey", 
        subsidyZkeyPath: "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey"       
    }

    const deployPollArgs: DeployPollArgs = {
        quiet: true,
        pollDuration: 90,
        maxMessages: 25,
        maxVoteOptions: 25,
        intStateTreeDepth: INT_STATE_TREE_DEPTH,
        messageTreeDepth: MSG_TREE_DEPTH,
        messageTreeSubDepth: MSG_BATCH_DEPTH,
        voteOptionTreeDepth: VOTE_OPTION_TREE_DEPTH,
        coordinatorPubkey: "macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330"
    }
  
    const timeTravelArgs: TimeTravelArgs = {
        quiet: true,
        seconds: 90
    }

    const mergeMessagesArgs: MergeMessagesArgs = {
        quiet: true, 
        pollId: 0
    }

    const mergeSignupsArgs: MergeSignupsArgs = {
        quiet: true,
        pollId: 0
    }

    const genProofsArgs: GenProofsArgs = {
        quiet: true,
        coordinatorPrivKey: "macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e",
        pollId: 0,
        processWitgen: "./zkeys/ProcessMessages_10-2-1-2_test",
        tallyWitgen: "./zkeys/TallyVotes_10-1-2_test",
        subsidyWitgen: "./zkeys/SubsidyPerBatch_10-1-2_test",
        processZkey: "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
        processWasm: "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
        subsidyZkey: "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
        subsidyWasm: "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
        tallyZkey: "./zkeys/TallyVotes_10-1-2_test.0.zkey",
        tallyWasm: "./zkeys/TallyVotes_10-1-2_test.wasm",
        tallyFile: "./tally.json",
        subsidyFile: "./subsidy.json",
        outputDir: "./proofs",
        rapidsnark: `${homedir()}/rapidsnark/build/prover`,
        useWasm
    }

    const proveOnChainArgs: ProveOnChainArgs = {
        quiet: true,
        pollId: '0',
        proofDir: "./proofs"
    }

    const verifyOnChainArgs: VerifyArgs = {
        quiet: true,
        pollId: '0',
        tallyFile: "./tally.json",
        subsidyFile: "./subsidy.json"
    }

    describe("test1", () => {
        after(() => { cleanSubsidy() })
        before(async () => {
            // we deploy the vk registry contract
            await deployVkRegistryContract(deployVkRegistryArgs)
            // we set the verifying keys
            await setVerifyingKeys(setVerifyingKeysArgs)
            // deploy the smart contracts
            await deploy({ quiet: true })
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
        })

        const signupArgs: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
        }
        const publishArgs: PublishArgs = {
            quiet: true,
            pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
            privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
            stateIndex: 1,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 9,
            pollId: 0
        }
        it("should signup one user", async () => {
            await signup(signupArgs)
        })
    
        it("should publish one message", async () => {
            await publish(publishArgs)
        })
    
        it("should time travel", async () => {
            await timeTravel(timeTravelArgs)
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(mergeMessagesArgs)
            await mergeSignups(mergeSignupsArgs)
            await genProofs(genProofsArgs)
        })
        it("should prove and verify the proofs", async () => {
            await proveOnChain(proveOnChainArgs)
            await verify(verifyOnChainArgs)
        })
    })

    describe("test2", () => {
        after(() => { cleanSubsidy() })
        before(async () => {
            // we deploy the vk registry contract
            await deployVkRegistryContract(deployVkRegistryArgs)
            // we set the verifying keys
            await setVerifyingKeys(setVerifyingKeysArgs)
            // deploy the smart contracts
            await deploy({ quiet: true })
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
        })

        const signupArgs1: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
        }
        
        const signupArgs2: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.6be0cedb8656b09ebb1af0bb691ba134620d0325366256bb8b543f83f6d6b811",
        }
        
        const signupArgs3: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.8c3cb4d632cabb0ee2135e8e9f11189190b3fd317bf402ed7d0daf2ab6430a0f",
        }
        
        const signupArgs4: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
        }
        
        const publishArgs1: PublishArgs = {
            quiet: true,
            pubkey: "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
            privateKey: "macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa",
            stateIndex: 1,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        const publishArgs2: PublishArgs = {
            quiet: true,
            pubkey: "macipk.6be0cedb8656b09ebb1af0bb691ba134620d0325366256bb8b543f83f6d6b811",
            privateKey: "macisk.12b56eaf1cfb62afa850060f493744ca2d8afc4687ce8c1683fc26f31acf7b84",
            stateIndex: 2,
            voteOptionIndex: 1,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs3: PublishArgs = {
            quiet: true,
            pubkey: "macipk.8c3cb4d632cabb0ee2135e8e9f11189190b3fd317bf402ed7d0daf2ab6430a0f",
            privateKey: "macisk.6f6b490c3a08bf46a0f419d77058a633fad73e3f03d8113b499a649e57bb325",
            stateIndex: 3,
            voteOptionIndex: 2,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs4: PublishArgs = {
            quiet: true,
            pubkey: "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
            privateKey: "macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd",
            stateIndex: 4,
            voteOptionIndex: 3,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs5: PublishArgs = {
            quiet: true,
            pubkey: "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
            privateKey: "macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd",
            stateIndex: 4,
            voteOptionIndex: 3,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs6: PublishArgs = {
            quiet: true,
            pubkey: "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
            privateKey: "macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd",
            stateIndex: 4,
            voteOptionIndex: 3,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        it("should signup four users", async () => {
            await signup(signupArgs1)
            await signup(signupArgs2)
            await signup(signupArgs3)
            await signup(signupArgs4)
        })
    
        it("should publish six messages", async () => {
            await publish(publishArgs1)
            await publish(publishArgs2)
            await publish(publishArgs3)
            await publish(publishArgs4)
            await publish(publishArgs5)
            await publish(publishArgs6)
        })
    
        it("should time travel", async () => {
            await timeTravel(timeTravelArgs)
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(mergeMessagesArgs)
            await mergeSignups(mergeSignupsArgs)
            await genProofs(genProofsArgs)
        })
        it("should prove and verify the proofs", async () => {
            await proveOnChain(proveOnChainArgs)
            await verify(verifyOnChainArgs)
        })
    })

    describe("test3", () => {
        after(() => { cleanSubsidy() })
        const signupArgs1: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
        }
        
        const signupArgs2: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.6be0cedb8656b09ebb1af0bb691ba134620d0325366256bb8b543f83f6d6b811",
        }
        
        const signupArgs3: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.8c3cb4d632cabb0ee2135e8e9f11189190b3fd317bf402ed7d0daf2ab6430a0f",
        }
        
        const signupArgs4: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
        }
        
        const signupArgs5: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
        }
        
        const signupArgs6: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.193c37dcb7db9bca854448e2b99b5d7e33e4c8a6f032e472a32578972e64031a",
        }
        
        const signupArgs7: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.c380cb7b743da3ee6f72f847f3f8e0ab2a49fe4326547d1784555b04add4cc2c",
        }
        
        const signupArgs8: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.4e1bdd5cbe0cfc9aa5b28cf0e7440932b689abd5e19072162495d312f3cc6525",
        }
        
        const signupArgs9: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.e312ccfd650ae6319350b2fbd40f0900c0896fbd4bd03cebfb98f8c6df187096",
        }
        
        const publishArgs1: PublishArgs = {
            quiet: true,
            pubkey: "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
            privateKey: "macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa",
            stateIndex: 1,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }

        before(async () => {
            // we deploy the vk registry contract
            await deployVkRegistryContract(deployVkRegistryArgs)
            // we set the verifying keys
            await setVerifyingKeys(setVerifyingKeysArgs)
            // deploy the smart contracts
            await deploy({ quiet: true })
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
        })

        it("should signup nine users", async () => {
            await signup(signupArgs1)
            await signup(signupArgs2)
            await signup(signupArgs3)
            await signup(signupArgs4)
            await signup(signupArgs5)
            await signup(signupArgs6)
            await signup(signupArgs7)
            await signup(signupArgs8)
            await signup(signupArgs9)
        })
    
        it("should publish one message", async () => {
            await publish(publishArgs1)
        })
    
        it("should time travel", async () => {
            await timeTravel(timeTravelArgs)
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(mergeMessagesArgs)
            await mergeSignups(mergeSignupsArgs)
            await genProofs(genProofsArgs)
        })
        it("should prove and verify the proofs", async () => {
            await proveOnChain(proveOnChainArgs)
            await verify(verifyOnChainArgs)
        })

    })

    describe("test4", () => {
        after(() => { cleanSubsidy() })

        const signupArgs: SignUpArgs[] = Array(8).fill({
            quiet: true,
            maciPubKey: "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
        });
        
        const publishArgs: PublishArgs[] = Array(12).fill({
            quiet: true,
            pubkey: "macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83",
            privateKey: "macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa",
            stateIndex: 1,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        });


        before(async () => {
            // we deploy the vk registry contract
            await deployVkRegistryContract(deployVkRegistryArgs)
            // we set the verifying keys
            await setVerifyingKeys(setVerifyingKeysArgs)
            // deploy the smart contracts
            await deploy({ quiet: true })
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
        })

        it("should signup eight users (same pub key)", async () => {
            for (const arg of signupArgs) await signup(arg)
        })
    
        it("should publish 12 messages with the same nonce", async () => {
            for (const arg of publishArgs) await publish(arg)
        })
    
        it("should time travel", async () => {
            await timeTravel(timeTravelArgs)
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(mergeMessagesArgs)
            await mergeSignups(mergeSignupsArgs)
            await genProofs(genProofsArgs)
        })
        it("should prove and verify the proofs", async () => {
            await proveOnChain(proveOnChainArgs)
            await verify(verifyOnChainArgs)
        })
    })

    describe("test5", () => {
        after(() => { cleanSubsidy() })

        const signupArgs1: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.4d8797043f3f54b9090cb7ddbb79a618297e3f94011e2d2b206dc05a52722498",
        }
        
        const signupArgs2: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.e774ca3c13d4a4b4599c13ed7fb8f82b21181d7787c7a29e76d63283b229e123",
        }
        
        const signupArgs3: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.1b3bb4ea01efad61877d04d8aa5fb2d3f509f75173be1411630cd7c47c02ea27",
        }
        
        const signupArgs4: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.3a88d434c5c5a3ca15b849c8542087026f7890f73451429d57e75f4a3c9e7581",
        }
        
        const publishArgs1: PublishArgs = {
            quiet: true,
            pubkey: "macipk.4d8797043f3f54b9090cb7ddbb79a618297e3f94011e2d2b206dc05a52722498",
            privateKey: "macisk.295f450eacd883207b0eee91a95439bd45e3332b3f7ac13a1847fbed84f16bd1",
            stateIndex: 1,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs2: PublishArgs = {
            quiet: true,
            pubkey: "macipk.e774ca3c13d4a4b4599c13ed7fb8f82b21181d7787c7a29e76d63283b229e123",
            privateKey: "macisk.1d30cdd3bb93910580e0c0718c45ec65b7ab2fa2e87c5ba6800612ab00c2175e",
            stateIndex: 2,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs3: PublishArgs = {
            quiet: true,
            pubkey: "macipk.1b3bb4ea01efad61877d04d8aa5fb2d3f509f75173be1411630cd7c47c02ea27",
            privateKey: "macisk.10da10e0e9a5cc1a7a9505868940ca7d493eef6589b860e8de287a7f5d65dce1",
            stateIndex: 3,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs4: PublishArgs = {
            quiet: true,
            pubkey: "macipk.3a88d434c5c5a3ca15b849c8542087026f7890f73451429d57e75f4a3c9e7581",
            privateKey: "macisk.58dbcf4ee007b14856192fb336bba171fcb5a630f4954d49e49ac1d95af360e",
            stateIndex: 4,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }

        before(async () => {
            // we deploy the vk registry contract
            await deployVkRegistryContract(deployVkRegistryArgs)
            // we set the verifying keys
            await setVerifyingKeys(setVerifyingKeysArgs)
            // deploy the smart contracts
            await deploy({ quiet: true })
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
        })

        it("should signup four users", async () => {
            await signup(signupArgs1)
            await signup(signupArgs2)
            await signup(signupArgs3)
            await signup(signupArgs4)
        })
    
        it("should publish four messages", async () => {
            await publish(publishArgs1)
            await publish(publishArgs2)
            await publish(publishArgs3)
            await publish(publishArgs4)
        })
    
        it("should time travel", async () => {
            await timeTravel(timeTravelArgs)
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(mergeMessagesArgs)
            await mergeSignups(mergeSignupsArgs)
            await genProofs(genProofsArgs)
        })
        it("should prove and verify the proofs", async () => {
            await proveOnChain(proveOnChainArgs)
            await verify(verifyOnChainArgs)
        })
    })

    describe("test6", () => {
        after(() => { cleanSubsidy() })

        const signupArgs1: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.014cc8ef5a0022da608efab55e891417be0a474ba70b912dc6c2e6acea1a1499",
        }
        
        const signupArgs2: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.0b1ec710ee4cac976b027e2fdabd2647c6dc6389ca4168db09ce79b3688ab598",
        }
        
        const signupArgs3: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.adfdafaa47e79c71995b4d9a6783e610098a28a79d96804034a1c7174a9b748c",
        }
        
        const signupArgs4: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.bfd90ae77a492e527c7ba5e451cc03bc7706982b11c2e0ae35e380fb541b0e95",
        }
        
        const signupArgs5: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.f7dc5da79e53d8e634f58506be11bc593f4d731834cbffc0fadff319215f8aad",
        }
        
        const publishArgs1: PublishArgs = {
            quiet: true,
            pubkey: "macipk.014cc8ef5a0022da608efab55e891417be0a474ba70b912dc6c2e6acea1a1499",
            privateKey: "macisk.2d257e1ce4acac2dcd5d25b3802a0e64c7c27a6e8f76ba48f41c90a2c1f8bf2a",
            stateIndex: 1,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        // Repeat the same for other publishArgs
        const publishArgs2: PublishArgs = {
            quiet: true,
            pubkey: "macipk.0b1ec710ee4cac976b027e2fdabd2647c6dc6389ca4168db09ce79b3688ab598",
            privateKey: "macisk.179b7213d423381d25f9ef8ba3040c9e1e8b785600ab3484d042c13bfe3e7b7b",
            stateIndex: 2,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs3: PublishArgs = {
            quiet: true,
            pubkey: "macipk.adfdafaa47e79c71995b4d9a6783e610098a28a79d96804034a1c7174a9b748c",
            privateKey: "macisk.ce8ca954499a2e6ef89ba1f29b457f8cdfe7e2fd1f8b7baa33ecc7b1bb797f8",
            stateIndex: 3,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs4: PublishArgs = {
            quiet: true,
            pubkey: "macipk.bfd90ae77a492e527c7ba5e451cc03bc7706982b11c2e0ae35e380fb541b0e95",
            privateKey: "macisk.28c1c7bb2b081da17e82075264ec20d6a022fbd54e0a0568b94fcaaef45fe261",
            stateIndex: 4,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }
        
        const publishArgs5: PublishArgs = {
            quiet: true,
            pubkey: "macipk.f7dc5da79e53d8e634f58506be11bc593f4d731834cbffc0fadff319215f8aad",
            privateKey: "macisk.1ee8e41c2b79b1a79659ccde72ed0e24b1ad97c7c550aaf8261defb46eb78343",
            stateIndex: 5,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 1,
            pollId: 0
        }

        before(async () => {
            // we deploy the vk registry contract
            await deployVkRegistryContract(deployVkRegistryArgs)
            // we set the verifying keys
            await setVerifyingKeys(setVerifyingKeysArgs)
            // deploy the smart contracts
            await deploy({ quiet: true })
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
        })

        it("should signup five users", async () => {
            await signup(signupArgs1)
            await signup(signupArgs2)
            await signup(signupArgs3)
            await signup(signupArgs4)
            await signup(signupArgs5)
        })
    
        it("should publish five messages", async () => {
            await publish(publishArgs1)
            await publish(publishArgs2)
            await publish(publishArgs3)
            await publish(publishArgs4)
            await publish(publishArgs5)
        })
    
        it("should time travel", async () => {
            await timeTravel(timeTravelArgs)
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(mergeMessagesArgs)
            await mergeSignups(mergeSignupsArgs)
            await genProofs(genProofsArgs)
        })
        it("should prove and verify the proofs", async () => {
            await proveOnChain(proveOnChainArgs)
            await verify(verifyOnChainArgs)
        })
    })

    describe("test7", () => {
        after(() => { cleanSubsidy() })

        const signupArgs: SignUpArgs[] = Array(6).fill({
            quiet: true,
            maciPubKey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391"
        });

        const publishArgs: PublishArgs[] = [
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 6,
                voteOptionIndex: 5,
                nonce: 1,
                newVoteWeight: 6,
                pollId: 0
            },
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 5,
                voteOptionIndex: 5,
                nonce: 2,
                newVoteWeight: 5,
                pollId: 0
            },
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 5,
                voteOptionIndex: 4,
                nonce: 1,
                pollId: 0,
                newVoteWeight: 5
            },
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 4,
                voteOptionIndex: 4,
                nonce: 2,
                pollId: 0,
                newVoteWeight: 4
            },
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 4,
                voteOptionIndex: 3,
                nonce: 1,
                pollId: 0,
                newVoteWeight: 4
            }, 
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 3,
                voteOptionIndex: 3,
                nonce: 2,
                pollId: 0,
                newVoteWeight: 3
            }, 
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 2,
                voteOptionIndex: 2,
                nonce: 2,
                pollId: 0,
                newVoteWeight: 2
            }, 
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 2,
                voteOptionIndex: 1,
                nonce: 1,
                pollId: 0,
                newVoteWeight: 2
            }, 
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 1,
                voteOptionIndex: 1,
                nonce: 2,
                pollId: 0,
                newVoteWeight: 1
            },
            {
                quiet: true,
                pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                stateIndex: 1,
                voteOptionIndex: 0,
                nonce: 1,
                pollId: 0,
                newVoteWeight: 1
            }, 
        ]


        before(async () => {
            // we deploy the vk registry contract
            await deployVkRegistryContract(deployVkRegistryArgs)
            // we set the verifying keys
            await setVerifyingKeys(setVerifyingKeysArgs)
            // deploy the smart contracts
            await deploy({ quiet: true })
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
        })

        it("should signup an user", async () => {
            for (const arg of signupArgs) await signup(arg)
        })

        it("should publish all messages", async () => {
            for (const arg of publishArgs) await publish(arg)
        })

        it("should do all processing", async () => {
            await timeTravel(timeTravelArgs)
            await mergeMessages(mergeMessagesArgs)
            await mergeSignups(mergeSignupsArgs)
            await genProofs(genProofsArgs)
            await proveOnChain(proveOnChainArgs)
            await verify(verifyOnChainArgs)
        })
    })

    describe("multiplePolls1", () => {
        after(() => { cleanSubsidy() })

        const signupArgs: SignUpArgs = {
            quiet: true,
            maciPubKey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
        }
        const publishArgs: PublishArgs = {
            quiet: true,
            pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
            privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
            stateIndex: 1,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 9,
            pollId: 0
        }

        const publishArgs2: PublishArgs = {
            quiet: true,
            pubkey: "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
            privateKey: "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
            stateIndex: 1,
            voteOptionIndex: 0,
            newVoteWeight: 7,
            nonce: 1,
            pollId: 1
        }

        const mergeMessagesArgs2: MergeMessagesArgs = {
            quiet: true,
            pollId: 1,
        }

        const mergeSignupsArgs2: MergeSignupsArgs = {
            quiet: true,
            pollId: 1,
        }

        const genProofsArgs2: GenProofsArgs = {
            quiet: true,
            coordinatorPrivKey: "macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e",
            pollId: 1,
            processWitgen: "./zkeys/ProcessMessages_10-2-1-2_test",
            tallyWitgen: "./zkeys/TallyVotes_10-1-2_test",
            subsidyWitgen: "./zkeys/SubsidyPerBatch_10-1-2_test",
            processZkey: "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
            processWasm: "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
            subsidyZkey: "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
            subsidyWasm: "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
            tallyZkey: "./zkeys/TallyVotes_10-1-2_test.0.zkey",
            tallyWasm: "./zkeys/TallyVotes_10-1-2_test.wasm",
            tallyFile: "./tally.json",
            subsidyFile: "./subsidy.json",
            outputDir: "./proofs",
            rapidsnark: `${homedir()}/rapidsnark/build/prover`,
            useWasm
        }
    
        const proveOnChainArgs2: ProveOnChainArgs = {
            quiet: true,
            pollId: '1',
            proofDir: "./proofs"
        }
    
        const verifyOnChainArgs2: VerifyArgs = {
            quiet: true,
            pollId: '1',
            tallyFile: "./tally.json",
            subsidyFile: "./subsidy.json",
        }

        before(async () => {
            // we deploy the vk registry contract
            await deployVkRegistryContract(deployVkRegistryArgs)
            // we set the verifying keys
            await setVerifyingKeys(setVerifyingKeysArgs)
            // deploy the smart contracts
            await deploy({ quiet: true })
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
            // signup 
            await signup(signupArgs)
            // publish 
            await publish(publishArgs)
            // time travel
            await timeTravel(timeTravelArgs)
            // generate proofs
            await mergeMessages(mergeMessagesArgs)
            await mergeSignups(mergeSignupsArgs)
            await genProofs(genProofsArgs)
            // prove and verify
            await proveOnChain(proveOnChainArgs)
            await verify(verifyOnChainArgs)
            // cleanup 
            cleanSubsidy()
        })

        it("should deploy a new poll", async () => {
            await deployPoll(deployPollArgs)
        })
        it("should publish a new message", async () => {
            await publish(publishArgs2)
        })
        it("should generate proofs and verify them", async () => {
            await timeTravel(timeTravelArgs)
            await mergeMessages(mergeMessagesArgs2)
            await mergeSignups(mergeSignupsArgs2)
            await genProofs(genProofsArgs2)
            await proveOnChain(proveOnChainArgs2)
            await verify(verifyOnChainArgs2)
        })
    })

    describe("multiplePolls2", () => {
        const signupArgs: SignUpArgs[] = [
            { quiet: true, maciPubKey: "macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9" },
            { quiet: true, maciPubKey: "macipk.7d7cc9967a05d54d723253be7e43de570e56eda8bc86cc299f7bdb410d92e41c" },
            { quiet: true, maciPubKey: "macipk.29ba2f405ed1636997e6bff15463d05a2021ca5a1711952cbb03e42cdd8f7f13" },
            { quiet: true, maciPubKey: "macipk.2f4bd0898d9ea4df8c902ff2e3aeb9750b8a2bc89f35171051cfd3ba668fbc0c" },
            { quiet: true, maciPubKey: "macipk.bd4c03ecd1b9799ca7ab6ec6309568d9f743c4128d5d7f43d8a17f8af0dae31d" },
            { quiet: true, maciPubKey: "macipk.49ee4bfba86c36cb43e60772825b55a2209b52ff202d8caf091b6921e193a290" },
            { quiet: true, maciPubKey: "macipk.d354c22572a0b53ced8561f9ab16abe0b8f7f98c2133757e93cdefd45fe1b192" },
        ]
        
        const publishArgs1: PublishArgs = {
            quiet: true,
            pubkey: "macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9",
            privateKey: "macisk.14db4cdf1fb42bee444c83aed43c40db6b1a2c79fa1067332b09b5dff0df19c5",
            stateIndex: 1,
            voteOptionIndex: 0,
            nonce: 1,
            newVoteWeight: 9,
            pollId: 0
        }

        const publishArgs2: PublishArgs = {
            quiet: true,
            pubkey: "macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9",
            privateKey: "macisk.14db4cdf1fb42bee444c83aed43c40db6b1a2c79fa1067332b09b5dff0df19c5",
            stateIndex: 1,
            voteOptionIndex: 1,
            nonce: 1,
            newVoteWeight: 9,
            pollId: 1
        }
        
        const publishArgs3: PublishArgs = {
            quiet: true,
            pubkey: "macipk.7d7cc9967a05d54d723253be7e43de570e56eda8bc86cc299f7bdb410d92e41c",
            privateKey: "macisk.2044549fd073daf95bfed48ab0583a6cc5cea0f45e11885a2670e712409d739",
            stateIndex: 2,
            voteOptionIndex: 2,
            nonce: 1,
            newVoteWeight: 2,
            pollId: 1
        }
        
        const publishArgs4: PublishArgs = {
            quiet: true,
            pubkey: "macipk.29ba2f405ed1636997e6bff15463d05a2021ca5a1711952cbb03e42cdd8f7f13",
            privateKey: "macisk.18843ce600faa1656c6d1fed25b08b2c39a9aa3081d3b12eccc162e59d576ba4",
            stateIndex: 3,
            voteOptionIndex: 3,
            nonce: 1,
            newVoteWeight: 3,
            pollId: 1
        }

        const publishArgs5: PublishArgs = {
            quiet: true,
            pubkey: "macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9",
            privateKey: "macisk.14db4cdf1fb42bee444c83aed43c40db6b1a2c79fa1067332b09b5dff0df19c5",
            stateIndex: 1,
            voteOptionIndex: 1,
            nonce: 1,
            newVoteWeight: 9,
            pollId: 2
        }
        
        const publishArgs6: PublishArgs = {
            quiet: true,
            pubkey: "macipk.7d7cc9967a05d54d723253be7e43de570e56eda8bc86cc299f7bdb410d92e41c",
            privateKey: "macisk.2044549fd073daf95bfed48ab0583a6cc5cea0f45e11885a2670e712409d739",
            stateIndex: 2,
            voteOptionIndex: 2,
            nonce: 1,
            newVoteWeight: 2,
            pollId: 2
        }
        
        const publishArgs7: PublishArgs = {
            quiet: true,
            pubkey: "macipk.bd4c03ecd1b9799ca7ab6ec6309568d9f743c4128d5d7f43d8a17f8af0dae31d",
            privateKey: "macisk.1be69bd4979ad867bca3b0f44507f972f0c4699b65b0bd2de09325965648685e",
            stateIndex: 5,
            voteOptionIndex: 5,
            nonce: 1,
            newVoteWeight: 5,
            pollId: 2
        }

        const mergeMessagesArgs2: MergeMessagesArgs = {
            quiet: true,
            pollId: 1,
        }

        const mergeSignupsArgs2: MergeSignupsArgs = {
            quiet: true,
            pollId: 1,
        }

        const mergeMessagesArgs3: MergeMessagesArgs = {
            quiet: true,
            pollId: 2,
        }

        const mergeSignupsArgs3: MergeSignupsArgs = {
            quiet: true,
            pollId: 2,
        }

        const genProofsArgs2: GenProofsArgs = {
            quiet: true,
            coordinatorPrivKey: "macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e",
            pollId: 1,
            processWitgen: "./zkeys/ProcessMessages_10-2-1-2_test",
            tallyWitgen: "./zkeys/TallyVotes_10-1-2_test",
            subsidyWitgen: "./zkeys/SubsidyPerBatch_10-1-2_test",
            processZkey: "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
            processWasm: "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
            subsidyZkey: "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
            subsidyWasm: "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
            tallyZkey: "./zkeys/TallyVotes_10-1-2_test.0.zkey",
            tallyWasm: "./zkeys/TallyVotes_10-1-2_test.wasm",
            tallyFile: "./tally.json",
            subsidyFile: "./subsidy.json",
            outputDir: "./proofs",
            rapidsnark: `${homedir()}/rapidsnark/build/prover`,
            useWasm
        }

        const genProofsArgs3: GenProofsArgs = {
            quiet: true,
            coordinatorPrivKey: "macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e",
            pollId: 2,
            processWitgen: "./zkeys/ProcessMessages_10-2-1-2_test",
            tallyWitgen: "./zkeys/TallyVotes_10-1-2_test",
            subsidyWitgen: "./zkeys/SubsidyPerBatch_10-1-2_test",
            processZkey: "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
            processWasm: "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
            subsidyZkey: "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
            subsidyWasm: "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
            tallyZkey: "./zkeys/TallyVotes_10-1-2_test.0.zkey",
            tallyWasm: "./zkeys/TallyVotes_10-1-2_test.wasm",
            tallyFile: "./tally.json",
            subsidyFile: "./subsidy.json",
            outputDir: "./proofs",
            rapidsnark: `${homedir()}/rapidsnark/build/prover`,
            useWasm
        }

        const proveOnChainArgs2: ProveOnChainArgs = {
            quiet: true,
            pollId: '1',
            proofDir: "./proofs"
        }
    
        const verifyOnChainArgs2: VerifyArgs = {
            quiet: true,
            pollId: '1',
            tallyFile: "./tally.json",
            subsidyFile: "./subsidy.json",
        }

        const proveOnChainArgs3: ProveOnChainArgs = {
            quiet: true,
            pollId: '2',
            proofDir: "./proofs"
        }
    
        const verifyOnChainArgs3: VerifyArgs = {
            quiet: true,
            pollId: '2',
            tallyFile: "./tally.json",
            subsidyFile: "./subsidy.json",
        }

        after(() => { cleanSubsidy() })
        before(async () => {
            // we deploy the vk registry contract
            await deployVkRegistryContract(deployVkRegistryArgs)
            // we set the verifying keys
            await setVerifyingKeys(setVerifyingKeysArgs)
            // deploy maci as we need the address
            await deploy({ quiet: true })
        })

        it("should run the first poll", async () => {
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
            // signup 
            for (const arg of signupArgs) await signup(arg)
            // publish 
            await publish(publishArgs1)
            // time travel
            await timeTravel(timeTravelArgs)
            // generate proofs
            await mergeMessages(mergeMessagesArgs)
            await mergeSignups(mergeSignupsArgs)
            await genProofs(genProofsArgs)
            // prove and verify
            await proveOnChain(proveOnChainArgs)
            await verify(verifyOnChainArgs)
            // cleanup
            cleanSubsidy()
        })

        it("should deploy two more polls", async () => {
            // deploy a poll contract
            await deployPoll(deployPollArgs) 
            await deployPoll(deployPollArgs) 
        })

        it("should publish messages to the second poll", async () => {
            await publish(publishArgs2)
            await publish(publishArgs3)
            await publish(publishArgs4)
        })

        it("should publish messages to the third poll", async () => {
            await publish(publishArgs5)
            await publish(publishArgs6)
            await publish(publishArgs7)
        })

        it("should time travel", async () => {
            await timeTravel(timeTravelArgs)
        })

        it("should complete the second poll", async () => {
            await mergeMessages(mergeMessagesArgs2)
            await mergeSignups(mergeSignupsArgs2)
            await genProofs(genProofsArgs2)
            await proveOnChain(proveOnChainArgs2)
            await verify(verifyOnChainArgs2)
            cleanSubsidy()
        })

        it("should complete the third poll", async () => {
            await mergeMessages(mergeMessagesArgs3)
            await mergeSignups(mergeSignupsArgs3)
            await genProofs(genProofsArgs3)
            await proveOnChain(proveOnChainArgs3)
            await verify(verifyOnChainArgs3)
        })
    })
})