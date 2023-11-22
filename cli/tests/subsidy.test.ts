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
    INT_STATE_TREE_DEPTH, 
    MSG_BATCH_DEPTH, 
    MSG_TREE_DEPTH, 
    STATE_TREE_DEPTH, 
    VOTE_OPTION_TREE_DEPTH, 
    coordinatorPrivKey, 
    coordinatorPubKey
} from "./utilities/constants"
import {
    homedir
} from "os"
import { cleanSubsidy } from "./utilities/utils"
import { isArm } from "maci-circuits"

describe("Subsidy tests", function() {
    const useWasm = isArm() 
    this.timeout(900000)
  
    before(async () => {
        // we deploy the vk registry contract
        await deployVkRegistryContract(true)
        // we set the verifying keys
        await setVerifyingKeys(
            STATE_TREE_DEPTH,
            INT_STATE_TREE_DEPTH,
            MSG_TREE_DEPTH,
            VOTE_OPTION_TREE_DEPTH,
            MSG_BATCH_DEPTH,
            "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
            "./zkeys/TallyVotes_10-1-2_test.0.zkey",   
            undefined,
            "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
            true
        )
    })
    describe("test1", () => {
        after(async () => {
            cleanSubsidy()
        })
        before(async () => {
            // deploy the smart contracts
            await deploy(undefined, undefined, undefined, undefined, true)
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true,
            )
        })

        it("should signup one user", async () => {
            await signup(
                "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                undefined,
                undefined,
                undefined,
                true 
            )
        })
    
        it("should publish one message", async () => {
            await publish(
                "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                1,
                0,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                true 
            )
        })
    
        it("should time travel", async () => {
            await timeTravel(
                90,
                true
            )
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(0, undefined, undefined, true)
            await mergeSignups(0, undefined, undefined, true)
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                0,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
        })
        it("should prove and verify the proofs", async () => {
            await proveOnChain(
                '0',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '0',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true
            )
        })
    })

    describe("test2", () => {
        after (() => cleanSubsidy())

        before(async () => {
            // deploy the smart contracts
            await deploy(undefined, undefined, undefined, undefined, true)
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true,
            )
        })
        

        it("should signup four users", async () => {
            await signup(
                "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
                undefined,
                undefined,
                undefined,
                true 
            )
            await signup(
                "macipk.6be0cedb8656b09ebb1af0bb691ba134620d0325366256bb8b543f83f6d6b811",
                undefined,
                undefined,
                undefined,
                true  
            )
            await signup(
                "macipk.8c3cb4d632cabb0ee2135e8e9f11189190b3fd317bf402ed7d0daf2ab6430a0f",
                undefined,
                undefined,
                undefined,
                true 
            )
            await signup(
                "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
                undefined,
                undefined,
                undefined,
                true 
            )
        })
    
        it("should publish six messages", async () => {
            await publish(
                "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
                1,
                0,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa",
                true 
            )
            await publish(
                "macipk.6be0cedb8656b09ebb1af0bb691ba134620d0325366256bb8b543f83f6d6b811",
                2,
                1,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.12b56eaf1cfb62afa850060f493744ca2d8afc4687ce8c1683fc26f31acf7b84",
                true 
            )
            await publish(
                "macipk.8c3cb4d632cabb0ee2135e8e9f11189190b3fd317bf402ed7d0daf2ab6430a0f",
                3,
                2,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.6f6b490c3a08bf46a0f419d77058a633fad73e3f03d8113b499a649e57bb325",
                true
            )
            await publish(
                "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
                4,
                3,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd",
                true 
            )
            await publish(
                "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
                4,
                3,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd",
                true 
            )
            await publish(
                "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
                4,
                3,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd",
                true 
            )
        })
    
        it("should time travel", async () => {
            await timeTravel(
                90,
                true
            )
        })
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(
                0,
                undefined,
                undefined,
                true
            )
            await mergeSignups(
                0,
                undefined,
                undefined,
                true
            )
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                0,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
        })
        it("should prove and verify the proofs", async () => {
            await proveOnChain(
                '0',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '0',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true
            )
        })
    })

    describe("test3", () => {
        after (() => cleanSubsidy())

        before(async () => {
            // deploy the smart contracts
            await deploy(undefined, undefined, undefined, undefined, true)
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true,
            )
        })

        it("should signup nine users", async () => {
            await signup(
                "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.6be0cedb8656b09ebb1af0bb691ba134620d0325366256bb8b543f83f6d6b811",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.8c3cb4d632cabb0ee2135e8e9f11189190b3fd317bf402ed7d0daf2ab6430a0f",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.46d7ffe59b2f9c0e92dc69a4abd8c292e90003cc0ffc0cb1f23d73dab0333baa",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.193c37dcb7db9bca854448e2b99b5d7e33e4c8a6f032e472a32578972e64031a",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.c380cb7b743da3ee6f72f847f3f8e0ab2a49fe4326547d1784555b04add4cc2c",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.4e1bdd5cbe0cfc9aa5b28cf0e7440932b689abd5e19072162495d312f3cc6525",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.e312ccfd650ae6319350b2fbd40f0900c0896fbd4bd03cebfb98f8c6df187096",
                undefined,
                undefined,
                undefined,
                true
            )
        })
    
        it("should publish one message", async () => {
            await publish(
                "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
                1,
                0,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa",
                true 
            )
        })
    
        it("should time travel", async () => {
            await timeTravel(
                90,
                true
            )
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(
                0,
                undefined,
                undefined,
                true
            )
            await mergeSignups(
                0,
                undefined,
                undefined,
                true
            )
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                0,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
        })
        it("should prove and verify the proofs", async () => {
            await proveOnChain(
                '0',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '0',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true
            )
        })

    })

    describe("test4", () => {
        after (() => cleanSubsidy())
        
        before(async () => {
            // deploy the smart contracts
            await deploy(undefined, undefined, undefined, undefined, true)
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true,
            )
        })

        it("should signup eight users (same pub key)", async () => {
            for (let i = 0; i < 8; i++) await signup(
                "macipk.b1672ac299bb443f89bca9aeface6edfa5319a4b2135588ca1bfb352d7d09d1e",
                undefined,
                undefined,
                undefined,
                true
            )
        })
    
        it("should publish 12 messages with the same nonce", async () => {
            for (let i = 0; i < 12; i++) await publish(
                "macipk.1f968d8a40d8f7ffde4fa70b7c24170be1bb258948c50f85c6bdfe380ca25f83",
                1,
                0,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa",
                true
            )
        })
    
        it("should time travel", async () => {
            await timeTravel(
                90,
                true
            )
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(
                0,
                undefined,
                undefined,
                true
            )
            await mergeSignups(
                0,
                undefined,
                undefined,
                true
            )
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                0,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
        })

        it("should prove and verify the proofs", async () => {
            await proveOnChain(
                '0',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '0',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true
            )
        })
    })

    describe("test5", () => {
        after (() => cleanSubsidy())
        before(async () => {
            // deploy the smart contracts
            await deploy(undefined, undefined, undefined, undefined, true)
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true,
            )
        })

        it("should signup four users", async () => {
            await signup(
                "macipk.4d8797043f3f54b9090cb7ddbb79a618297e3f94011e2d2b206dc05a52722498",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.e774ca3c13d4a4b4599c13ed7fb8f82b21181d7787c7a29e76d63283b229e123",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.1b3bb4ea01efad61877d04d8aa5fb2d3f509f75173be1411630cd7c47c02ea27",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.3a88d434c5c5a3ca15b849c8542087026f7890f73451429d57e75f4a3c9e7581",
                undefined,
                undefined,
                undefined,
                true
            )
        })
    
        it("should publish four messages", async () => {
            await publish(
                "macipk.4d8797043f3f54b9090cb7ddbb79a618297e3f94011e2d2b206dc05a52722498",
                1,
                0,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa",
                true
            )
            await publish(
                "macipk.e774ca3c13d4a4b4599c13ed7fb8f82b21181d7787c7a29e76d63283b229e123",
                2,
                1,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.12b56eaf1cfb62afa850060f493744ca2d8afc4687ce8c1683fc26f31acf7b84",
                true
            )
            await publish(
                "macipk.1b3bb4ea01efad61877d04d8aa5fb2d3f509f75173be1411630cd7c47c02ea27",
                3,
                2,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.6f6b490c3a08bf46a0f419d77058a633fad73e3f03d8113b499a649e57bb325",
                true
            )
            await publish(
                "macipk.3a88d434c5c5a3ca15b849c8542087026f7890f73451429d57e75f4a3c9e7581",
                4,
                3,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd",
                true
            )
        })
    
        it("should time travel", async () => {
            await timeTravel(
                90,
                true
            )
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(
                0,
                undefined,
                undefined,
                true
            )
            await mergeSignups(
                0,
                undefined,
                undefined,
                true
            )
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                0,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
        })

        it("should prove and verify the proofs", async () => {
            await proveOnChain(
                '0',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '0',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true
            )
        })
    })

    describe("test6", () => {
        after (() => cleanSubsidy())

        before(async () => {
            // deploy the smart contracts
            await deploy(undefined, undefined, undefined, undefined, true)
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true,
            )
        })

        it("should signup five users", async () => {
            await signup(
                "macipk.014cc8ef5a0022da608efab55e891417be0a474ba70b912dc6c2e6acea1a1499",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.0b1ec710ee4cac976b027e2fdabd2647c6dc6389ca4168db09ce79b3688ab598",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.adfdafaa47e79c71995b4d9a6783e610098a28a79d96804034a1c7174a9b748c",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.bfd90ae77a492e527c7ba5e451cc03bc7706982b11c2e0ae35e380fb541b0e95",
                undefined,
                undefined,
                undefined,
                true
            )
            await signup(
                "macipk.f7dc5da79e53d8e634f58506be11bc593f4d731834cbffc0fadff319215f8aad",
                undefined,
                undefined,
                undefined,
                true
            )
        })
    
        it("should publish five messages", async () => {
            await publish(
                "macipk.014cc8ef5a0022da608efab55e891417be0a474ba70b912dc6c2e6acea1a1499",
                1,
                0,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.292ee6e47ff0225c12a2875408be223ad6653f73e4719496bad98838d3d4d4aa",
                true
            )
            await publish(
                "macipk.0b1ec710ee4cac976b027e2fdabd2647c6dc6389ca4168db09ce79b3688ab598",
                2,
                1,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.12b56eaf1cfb62afa850060f493744ca2d8afc4687ce8c1683fc26f31acf7b84",
                true
            )
            await publish(
                "macipk.adfdafaa47e79c71995b4d9a6783e610098a28a79d96804034a1c7174a9b748c",
                3,
                2,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.6f6b490c3a08bf46a0f419d77058a633fad73e3f03d8113b499a649e57bb325",
                true
            )
            await publish(
                "macipk.bfd90ae77a492e527c7ba5e451cc03bc7706982b11c2e0ae35e380fb541b0e95",
                4,
                3,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.2735caf7cfe7bcecb2900926090fefa5767f34a2038a102e9b34e7612a2a2ebd",
                true
            )
            await publish(
                "macipk.f7dc5da79e53d8e634f58506be11bc593f4d731834cbffc0fadff319215f8aad",
                5,
                4,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.6f6b490c3a08bf46a0f419d77058a633fad73e3f03d8113b499a649e57bb325",
                true
            )
        })
    
        it("should time travel", async () => {
            await timeTravel(
                90,
                true
            )
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(
                0,
                undefined,
                undefined,
                true
            )
            await mergeSignups(
                0,
                undefined,
                undefined,
                true
            )
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                0,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
        })

        it("should prove and verify the proofs", async () => {
            await proveOnChain(
                '0',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '0',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true
            )
        })
    })


    describe("test7", () => {
        after(() => { cleanSubsidy() })

        const publishArgs = [
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
            // deploy the smart contracts
            await deploy(undefined, undefined, undefined, undefined, true)
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true,
            )
        })

        it("should signup an user", async () => {
            for (let i = 0; i < 6; i++) await signup(
                "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                undefined,
                undefined,
                undefined,
                true
            )
        })

        it("should publish all messages", async () => {
            for (const arg of publishArgs) await publish(
                arg.pubkey,
                arg.stateIndex,
                arg.voteOptionIndex,
                arg.nonce,
                arg.pollId,
                arg.newVoteWeight,
                undefined,
                undefined,
                arg.privateKey,
                true
            )
        })

        it("should time travel", async () => {
            await timeTravel(
                90,
                true
            )
        })
    
        it("should generate zk-SNARK proofs", async () => {
            await mergeMessages(
                0,
                undefined,
                undefined,
                true
            )
            await mergeSignups(
                0,
                undefined,
                undefined,
                true
            )
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                0,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
        })

        it("should prove and verify the proofs", async () => {
            await proveOnChain(
                '0',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '0',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true
            )
        })
    })

    describe("multiplePolls1", () => {
        after (() => cleanSubsidy())
        before(async () => {
            // deploy the smart contracts
            await deploy(undefined, undefined, undefined, undefined, true)
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true,
            )
            // signup 
            await signup(
                "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                undefined,
                undefined,
                undefined,
                true
            )
            // publish 
            await publish(
                "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                1,
                0,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                true
            )
            // time travel
            await timeTravel(90, true)
            // generate proofs
            await mergeMessages(0, undefined, undefined, true)
            await mergeSignups(0, undefined, undefined, true)
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                0,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
            // prove and verify
            await proveOnChain(
                '0',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '0',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true 
            )
            cleanSubsidy()
        })

        it("should deploy a new poll", async () => {
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true
            )
        })
        it("should publish a new message", async () => {
            await publish(
                "macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391",
                1,
                0,
                1,
                1,
                7,
                undefined,
                undefined,
                "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                true
            )
        })
        it("should generate proofs and verify them", async () => {
            await timeTravel(90, true)
            await mergeMessages(1, undefined, undefined, true)
            await mergeSignups(1, undefined, undefined, true)
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                1,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
            await proveOnChain(
                '1',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify('1', './tally.json', undefined, undefined, undefined, "./subsidy.json", true)
        })
    })

    describe("multiplePolls2", () => {
        const publicKeys = [
            "macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9",
            "macipk.7d7cc9967a05d54d723253be7e43de570e56eda8bc86cc299f7bdb410d92e41c",
            "macipk.29ba2f405ed1636997e6bff15463d05a2021ca5a1711952cbb03e42cdd8f7f13",
            "macipk.2f4bd0898d9ea4df8c902ff2e3aeb9750b8a2bc89f35171051cfd3ba668fbc0c",
            "macipk.bd4c03ecd1b9799ca7ab6ec6309568d9f743c4128d5d7f43d8a17f8af0dae31d",
            "macipk.49ee4bfba86c36cb43e60772825b55a2209b52ff202d8caf091b6921e193a290",
            "macipk.d354c22572a0b53ced8561f9ab16abe0b8f7f98c2133757e93cdefd45fe1b192"
        ]

        after(() => { cleanSubsidy() })

        before(async () => {
            // deploy the smart contracts
            await deploy(undefined, undefined, undefined, undefined, true)
        })

        it("should run the first poll", async () => {
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true,
            )
            // signup 
            for (let i = 0; i < 7; i++) await signup(
                publicKeys[i],
                undefined,
                undefined,
                undefined,
                true
            )
            // publish 
            await publish(
                publicKeys[0],
                1,
                0,
                1,
                0,
                9,
                undefined,
                undefined,
                "macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c",
                true
            )
            // time travel
            await timeTravel(90, true)
            // generate proofs
            await mergeMessages(0, undefined, undefined, true)
            await mergeSignups(0, undefined, undefined, true)
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                0,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
            // prove and verify
            await proveOnChain(
                '0',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '0',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true 
            )
            cleanSubsidy()
        })

        it("should deploy two more polls", async () => {
            // deploy a poll contract
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true
            ) 
            await deployPoll(
                90,
                25,
                25,
                INT_STATE_TREE_DEPTH,
                MSG_BATCH_DEPTH,
                MSG_TREE_DEPTH,
                VOTE_OPTION_TREE_DEPTH,
                coordinatorPubKey,
                undefined,
                true
            ) 
        })

        it("should publish messages to the second poll", async () => {
            await publish(
                publicKeys[0],
                1,
                0,
                1,
                1,
                9,
                undefined,
                undefined,
                "macisk.14db4cdf1fb42bee444c83aed43c40db6b1a2c79fa1067332b09b5dff0df19c5",
                true
            )
            await publish(
                "macipk.7d7cc9967a05d54d723253be7e43de570e56eda8bc86cc299f7bdb410d92e41c",
                2,
                2,
                1,
                1,
                2,
                undefined,
                undefined,
                "macisk.2044549fd073daf95bfed48ab0583a6cc5cea0f45e11885a2670e712409d739",
                true
            )
            await publish(
                "macipk.29ba2f405ed1636997e6bff15463d05a2021ca5a1711952cbb03e42cdd8f7f13",
                3,
                3,
                1,
                1,
                3,
                undefined,
                undefined,
                "macisk.18843ce600faa1656c6d1fed25b08b2c39a9aa3081d3b12eccc162e59d576ba4",
                true
            )
        })

        it("should publish messages to the third poll", async () => {
            await publish(
                "macipk.d30bf8402e7d731e86ccc6d24726446bba3ee18e8df013ebb0c96a5b14914da9",
                1,
                1,
                1,
                2,
                9,
                undefined,
                undefined,
                "macisk.14db4cdf1fb42bee444c83aed43c40db6b1a2c79fa1067332b09b5dff0df19c5",
                true
            )
            
            await publish(
                "macipk.7d7cc9967a05d54d723253be7e43de570e56eda8bc86cc299f7bdb410d92e41c",
                2,
                2,
                1,
                2,
                5,
                undefined,
                undefined,
                "macisk.2044549fd073daf95bfed48ab0583a6cc5cea0f45e11885a2670e712409d739",
                true
            )
            
            await publish(
                "macipk.bd4c03ecd1b9799ca7ab6ec6309568d9f743c4128d5d7f43d8a17f8af0dae31d",
                5,
                5,
                1,
                2,
                5,
                undefined,
                undefined,
                "macisk.1be69bd4979ad867bca3b0f44507f972f0c4699b65b0bd2de09325965648685e",
                true
            )        
        })

        it("should time travel", async () => {
            await timeTravel(90, true)
        })

        it("should complete the second poll", async () => {
            await mergeMessages(1, undefined, undefined, true)
            await mergeSignups(1, undefined, undefined, true)
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                1,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
            await proveOnChain(
                '1',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '1',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true
            )
            cleanSubsidy()
        })

        it("should complete the third poll", async () => {
            await mergeMessages(2, undefined, undefined, true)
            await mergeSignups(2, undefined, undefined, true)
            await genProofs(
                "./proofs",
                "./tally.json",
                "./zkeys/TallyVotes_10-1-2_test.0.zkey",
                "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
                2,
                "./subsidy.json",
                "./zkeys/SubsidyPerBatch_10-1-2_test.0.zkey",
                `${homedir()}/rapidsnark/build/prover`,
                "./zkeys/ProcessMessages_10-2-1-2_test",
                "./zkeys/TallyVotes_10-1-2_test",
                "./zkeys/SubsidyPerBatch_10-1-2_test",
                coordinatorPrivKey,
                undefined,
                undefined,
                "./zkeys/ProcessMessages_10-2-1-2_test.wasm",
                "./zkeys/TallyVotes_10-1-2_test.wasm",
                "./zkeys/SubsidyPerBatch_10-1-2_test.wasm",
                useWasm,
                true
            )
            await proveOnChain(
                '2',
                "./proofs",
                undefined,
                undefined,
                undefined,
                undefined,
                true
            )
            await verify(
                '2',
                "./tally.json",
                undefined,
                undefined,
                undefined,
                "./subsidy.json",
                true
            )
        })
    })

})