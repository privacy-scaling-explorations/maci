const assert = require('chai').assert

const {
  maciContract,
  stateTreeContract,
  cmdTreeContract,
  signUpTokenContract
} = require('../_build/utils/contracts')

const { binarifyWitness, binarifyProvingKey } = require('../_build/utils/binarify')
const { createMerkleTree } = require('../_build/utils/merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('../_build/utils/helpers')
const { ecdh, randomPrivateKey, privateToPublicKey, signAndEncrypt } = require('../_build/utils/crypto')

const updateStateTreeProvingKey = require('../_build/circuits/update_state_tree_proving_key.json')
const updateStateTreeVerificationKey = require('../_build/circuits/update_tree_state_verifying_key.json')
const updateStateTreeCircuitDef = require('../_build/circuits/update_state_tree.json')

const { buildBn128 } = require('websnark')
const { Circuit, groth } = require('snarkjs')

const { ganacheConfig } = require('../maci-config')

const ethers = require('ethers')
const provider = new ethers.providers.JsonRpcProvider(ganacheConfig.host)

const snarkScalarField = 21888242871839275222246405745257275088548364400416034343698204186575808495617n

describe('MACI', () => {
  describe('#SmartContract', () => {
    it('Logic sequence testing', async () => {
      // Wallet setup
      const coordinatorWallet = new ethers.Wallet(ganacheConfig.privateKey, provider)

      const user1Wallet = new ethers.Wallet(
        '0x989d5b4da447ba1c7f5d48e3b4310d0eec08d4abd0f126b58249598abd8f4c37',
        provider
      )
      const user2Wallet = new ethers.Wallet(
        '0x9b813e37fdeda1dd8beb146a88318718b186eafd276d703312702717c8e3b14b',
        provider
      )

      // Setup User messages etc
      const coordinatorPublicKeyRaw = await maciContract.getCoordinatorPublicKey()
      const coordinatorPublicKey = coordinatorPublicKeyRaw.map(x => BigInt(x.toString()))

      const user1SecretKey = randomPrivateKey()
      const user1PublicKey = privateToPublicKey(user1SecretKey)
      const user1Message = [...user1PublicKey, 0n]
      const user1EncryptedMsg = signAndEncrypt(
        user1Message,
        user1SecretKey,
        user1SecretKey,
        coordinatorPublicKey
      )
      // Change votes, and add in user index
      const user1NewEncryptedMsg = signAndEncrypt(
        [0n, ...user1Message], // New message needs to have index in the first value
        user1SecretKey,
        user1SecretKey,
        coordinatorPublicKey
      )

      const user2SecretKey = randomPrivateKey()
      const user2PublicKey = privateToPublicKey(user2SecretKey)
      const user2Message = [...user2PublicKey, 0n]
      const user2EncryptedMsg = signAndEncrypt(
        user2Message,
        user2SecretKey,
        user2SecretKey,
        coordinatorPublicKey
      )

      // Variable declaration
      let oldRoot
      let newRoot

      // User sign up tokens
      let user1TokenIds = []
      let user2TokenIds = []

      let curTokenId

      const maciUser1Contract = maciContract.connect(user1Wallet)
      const maciUser2Contract = maciContract.connect(user2Wallet)

      // Try and publish a command, it needs to fail
      try {
        await maciContract.publishCommand(
          stringifyBigInts(user1EncryptedMsg),
          stringifyBigInts(user1PublicKey)
        )
        throw new Error('Should not be able to publish commands yet')
      } catch (e) {}

      // Try and sign up, make sure it fails
      // Fails because user1 and user2 hasn't sent
      // any erc721 tokens to the contract yet
      try {
        await maciUser1Contract.signUp(
          stringifyBigInts(user1EncryptedMsg),
          stringifyBigInts(user1PublicKey)
        )
        throw new Error('User 1 should not be able to sign up yet')
      } catch (e) {}

      try {
        await maciUser2Contract.signUp(
          stringifyBigInts(user2EncryptedMsg),
          stringifyBigInts(user2PublicKey)
        )
        throw new Error('User 2 should not be able to sign up yet')
      } catch (e) {}

      // 1. Mint some tokens and xfer to user1 and user2
      const signUpTokenOwnerContract = signUpTokenContract.connect(coordinatorWallet)

      // User 1 gets 2 tokens (make sure force close logic works)
      curTokenId = await signUpTokenOwnerContract.getCurrentSupply()
      user1TokenIds.push(curTokenId.toString())
      await signUpTokenOwnerContract.giveToken(user1Wallet.address)

      curTokenId = await signUpTokenOwnerContract.getCurrentSupply()
      user1TokenIds.push(curTokenId.toString())
      await signUpTokenOwnerContract.giveToken(user1Wallet.address)

      // User 2 gets 1 token
      curTokenId = await signUpTokenOwnerContract.getCurrentSupply()
      user2TokenIds.push(curTokenId.toString())
      await signUpTokenOwnerContract.giveToken(user2Wallet.address)

      // 2. User 1 sends token to contract
      const signUpTokenUser1Contract = signUpTokenContract.connect(user1Wallet)
      await signUpTokenUser1Contract.safeTransferFrom(
        user1Wallet.address.toString(),
        maciContract.address.toString(),
        user1TokenIds.pop() // Note: This is the token id param
      )
      await signUpTokenUser1Contract.safeTransferFrom(
        user1Wallet.address.toString(),
        maciContract.address.toString(),
        user1TokenIds.pop() // Note: This is the token id param
      )

      // Checks if sign up period has ended
      const signUpPeriodEnded = await maciContract.hasSignUpPeriodEnded()

      if (signUpPeriodEnded) {
        throw new Error('Sign Up period ended!')
      }

      oldRoot = await stateTreeContract.getRoot()

      // Now user should be able to sign up
      await maciUser1Contract.signUp(
        stringifyBigInts(user1EncryptedMsg),
        stringifyBigInts(user1PublicKey)
      )

      newRoot = await stateTreeContract.getRoot()

      // Make sure that when user signs up,
      // contract stateTree updates its root
      if (oldRoot.toString() === newRoot.toString()) {
        throw new Error('stateTree in contract not updated for user 1!')
      }

      // 3. User 2 sends token to contract
      const signUpTokenUser2Contract = signUpTokenContract.connect(user2Wallet)
      await signUpTokenUser2Contract.safeTransferFrom(
        user2Wallet.address.toString(),
        maciContract.address.toString(),
        user2TokenIds.pop() // Note: Token id has changed
      )

      oldRoot = await stateTreeContract.getRoot()

      // Now user should be able to sign up
      await maciUser2Contract.signUp(
        stringifyBigInts(user2EncryptedMsg),
        stringifyBigInts(user2PublicKey)
      )

      newRoot = await stateTreeContract.getRoot()

      // Make sure that when user signs up,
      // contract commandTree updates its root
      if (oldRoot.toString() === newRoot.toString()) {
        throw new Error('stateTree in contract not updated for user 2!')
      }

      // 4. Forcefully close signup period
      await maciContract.endSignUpPeriod()

      // 5. Make sure users can't vote anymore
      // (Even though they have sent some tokens)
      try {
        await maciUser1Contract.signUp(
          stringifyBigInts(user1EncryptedMsg),
          stringifyBigInts(user1PublicKey)
        )
        throw new Error('User 1 should not be able to sign up anymore')
      } catch (e) {}

      // 6. Make sure users can publish new commands now
      // Note: Everyone can publish a command, the coordinator
      //       to be able to decrypt it in order to add it into the state tree
      oldRoot = await cmdTreeContract.getRoot()
      await maciUser1Contract.publishCommand(
        stringifyBigInts(user1NewEncryptedMsg),
        stringifyBigInts(user1PublicKey)
      )
      newRoot = await cmdTreeContract.getRoot()

      // Make sure that when user signs up,
      // contract commandTree updates its root
      if (oldRoot.toString() === newRoot.toString()) {
        throw new Error('commandTree in contract not updated for publishCommand!')
      }
    })
  })

  describe('#CircomCircuit (Long)', () => {
    it('Circuit Root Generation', async () => {
      const wasmBn128 = await buildBn128()
      const zkSnark = groth

      // Command and State Tree
      const cmdTree = createMerkleTree(4, 0n)
      const stateTree = createMerkleTree(4, 0n)

      // Coordinator keys
      const coordinatorSecretKey = randomPrivateKey()
      const coordinatorPublicKey = privateToPublicKey(coordinatorSecretKey)

      // Create 3 users (for registration)
      const user1SecretKey = randomPrivateKey()
      const user1PublicKey = privateToPublicKey(user1SecretKey)
      const user1Message = [...user1PublicKey, 0n]
      const user1EncryptedMsg = signAndEncrypt(
        user1Message,
        user1SecretKey,
        user1SecretKey,
        coordinatorPublicKey
      )
      const user1Leaf = cmdTree.hash(user1EncryptedMsg)

      const user2SecretKey = randomPrivateKey()
      const user2PublicKey = privateToPublicKey(user2SecretKey)
      const user2Message = [...user2PublicKey, 0n]
      const user2EncryptedMsg = signAndEncrypt(
        user2Message,
        user2SecretKey,
        user2SecretKey,
        coordinatorPublicKey
      )
      const user2Leaf = cmdTree.hash(user2EncryptedMsg)

      const user3SecretKey = randomPrivateKey()
      const user3PublicKey = privateToPublicKey(user3SecretKey)
      const user3Message = [...user3PublicKey, 0n]
      const user3EncryptedMsg = signAndEncrypt(
        user3Message,
        user3SecretKey,
        user3SecretKey,
        coordinatorPublicKey
      )
      const user3Leaf = cmdTree.hash(user3EncryptedMsg)

      // Insert users into the cmdTree and stateTree
      cmdTree.insert(user1Leaf)
      cmdTree.insert(user2Leaf)
      cmdTree.insert(user3Leaf)

      // Only the stateTree saves the raw values
      stateTree.insert(user1Leaf, user1Message)
      stateTree.insert(user2Leaf, user2Message)
      stateTree.insert(user3Leaf, user3Message)

      // User 2 wants to choose their vote and change public key
      const user2NewSecretKey = randomPrivateKey()
      const user2NewPublicKey = privateToPublicKey(user2NewSecretKey)
      const user2NewMessage = [...user2NewPublicKey, 1n]
      const user2NewEncryptedMsg = signAndEncrypt(
        user2NewMessage,
        user2SecretKey, // Using old secret key to sign tx as thats what the circuit is validating against
        user2NewSecretKey,
        coordinatorPublicKey
      )
      const user2NewLeaf = cmdTree.hash(user2NewEncryptedMsg)

      // Submits it to the smart contract
      cmdTree.insert(user2NewLeaf, user2NewMessage)

      // Construct circuit inputs
      const [cmdTreePathElements, cmdTreePathIndex] = cmdTree.getPathUpdate(cmdTree.nextIndex - 1)

      // 1st index because we're getting user 2
      const [stateTreePathElements, stateTreePathIndex] = stateTree.getPathUpdate(1)

      const ecdhPrivateKey = ecdh(
        user2NewSecretKey,
        coordinatorPublicKey
      )

      const circuit = new Circuit(updateStateTreeCircuitDef)

      const circuitInput = {
        cmd_tree_root: stringifyBigInts(cmdTree.root),
        cmd_tree_path_elements: stringifyBigInts(cmdTreePathElements),
        cmd_tree_path_index: stringifyBigInts(cmdTreePathIndex),
        state_tree_root: stringifyBigInts(stateTree.root),
        state_tree_path_elements: stringifyBigInts(stateTreePathElements),
        state_tree_path_index: stringifyBigInts(stateTreePathIndex),
        encrypted_data: stringifyBigInts(user2NewEncryptedMsg),
        existing_public_key: stringifyBigInts(user2PublicKey),
        existing_state_tree_leaf: stringifyBigInts(user2Leaf),
        ecdh_private_key: stringifyBigInts(ecdhPrivateKey)
      }

      const witness = circuit.calculateWitness(circuitInput)
      assert(circuit.checkWitness(witness))

      const newRootIdx = circuit.getSignalIdx('main.new_state_tree_root')
      const newRoot = witness[newRootIdx]

      stateTree.update(1, user2NewLeaf, user2NewMessage)
      assert.equal(stateTree.root.toString(), newRoot.toString())

      const publicSignals = witness.slice(1, circuit.nPubInputs + circuit.nOutputs + 1)

      const witnessBin = binarifyWitness(witness)
      const updateStateTreeProvingKeyBin = binarifyProvingKey(updateStateTreeProvingKey)

      const proof = await wasmBn128.groth16GenProof(
        witnessBin,
        updateStateTreeProvingKeyBin
      )

      const isValid = zkSnark.isValid(
        unstringifyBigInts(updateStateTreeVerificationKey),
        unstringifyBigInts(proof),
        unstringifyBigInts(publicSignals)
      )
      assert.equal(isValid, true, 'Local Snark Proof is not valid!')

      const isValidOnChain = await maciContract.verifyUpdateStateTreeProof(
        stringifyBigInts(proof.pi_a).slice(0, 2),
        stringifyBigInts(proof.pi_b).map(x => x.reverse()).slice(0, 2),
        stringifyBigInts(proof.pi_c).slice(0, 2),
        stringifyBigInts(publicSignals.map(x => x % snarkScalarField))
      )

      assert.equal(isValidOnChain, true, 'Snark Proof failed on chain verification!')
    })
  })
})
