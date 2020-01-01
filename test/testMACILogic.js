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
const {
  multiHash,
  hash,
  sign,
  randomPrivateKey,
  privateToPublicKey,
  signAndEncrypt,
  babyJubJubPrivateKey
} = require('../_build/utils/crypto')

const updateStateTreeProvingKey = require('../_build/circuits/update_state_tree_proving_key.json')
const updateStateTreeVerificationKey = require('../_build/circuits/update_tree_state_verifying_key.json')
const updateStateTreeCircuitDef = require('../_build/circuits/update_state_tree.json')

const { buildBn128 } = require('websnark')
const { Circuit, groth } = require('snarkjs')

const { ganacheConfig } = require('../maci-config')

const ethers = require('ethers')
const provider = new ethers.providers.JsonRpcProvider(ganacheConfig.host)

const snarkScalarField = 21888242871839275222246405745257275088548364400416034343698204186575808495617n

const str2BigInt = s => {
  return BigInt(parseInt(
    Buffer.from(s).toString('hex'), 16
  ))
}

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
      const user1Sk = randomPrivateKey()
      const user1Pk = privateToPublicKey(user1Sk)

      const ephemeralSk = randomPrivateKey()
      const ephemeralPk = privateToPublicKey(ephemeralSk)

      const coordinatorSk = randomPrivateKey()
      const coordinatorPk = privateToPublicKey(coordinatorSk)

      // Contruct the tree(s))
      const voteOptionTree = createMerkleTree(2, 0n)
      const msgTree = createMerkleTree(4, 0n)
      const stateTree = createMerkleTree(4, 0n)

      // Insert candidates into vote option tree
      voteOptionTree.insert(hash(str2BigInt('candidate 1')))
      voteOptionTree.insert(hash(str2BigInt('candidate 2')))
      voteOptionTree.insert(hash(str2BigInt('candidate 3')))
      voteOptionTree.insert(hash(str2BigInt('candidate 4')))

      // Register users into the stateTree
      // stateTree index 0 is a random leaf
      // used to insert random data when the
      // decryption fails
      stateTree.insert(hash(str2BigInt('random data')))

      // User 1 vote option tree
      const user1VoteOptionTree = createMerkleTree(2, 0n)
      // insert first candidate with raw values
      user1VoteOptionTree.insert(hash(1n), 1n) // Assume we've already voted for candidate 1
      user1VoteOptionTree.insert(hash(0n))
      user1VoteOptionTree.insert(hash(0n))
      user1VoteOptionTree.insert(hash(0n))

      // Registers user 1
      const user1ExistingStateTreeData = [
        user1Pk[0], // public key x
        user1Pk[1], // public key y
        user1VoteOptionTree.root, // vote option tree root
      125n, // credit balance (100 is arbitrary for now)
      0n // nonce
      ]

      stateTree.insert(multiHash(user1ExistingStateTreeData))

      const user1StateTreeIndex = stateTree.nextIndex - 1

      // Insert more random data as we just want to validate user 1
      stateTree.insert(multiHash([0n, randomPrivateKey()]))
      stateTree.insert(multiHash([1n, randomPrivateKey()]))

      // Construct user 1 command
      // Note: command is unencrypted, message is encrypted
      const user1VoteOptionIndex = 0
      const user1VoteOptionWeight = 5
      const user1Command = [
        BigInt(user1StateTreeIndex), // user index in state tree
        user1Pk[0], // Same public key
        user1Pk[1], // Same public key
        BigInt(user1VoteOptionIndex), // Vote option index (voting for candidate 0)
        BigInt(user1VoteOptionWeight), // sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
        1n, // Nonce
        randomPrivateKey() // Random salt
      ]

      // Get signature (used as inputs to circuit)
      const user1CommandSignature = sign(
        user1Sk,
        multiHash(user1Command)
      )

      // Sign and encrypt user message
      const user1Message = signAndEncrypt(
        user1Command,
        user1Sk,
        ephemeralSk,
        coordinatorPk
      )

      // Insert random data (as we just want to process 1 command)
      msgTree.insert(multiHash([0n, randomPrivateKey()]))
      msgTree.insert(multiHash([1n, randomPrivateKey()]))
      msgTree.insert(multiHash([2n, randomPrivateKey()]))
      msgTree.insert(multiHash([3n, randomPrivateKey()]))

      // Insert user 1 command into command tree
      msgTree.insert(multiHash(user1Message)) // Note its index 4
      const user1MsgTreeIndex = msgTree.nextIndex - 1

      // Generate circuit inputs
      const [
        msgTreePathElements,
        msgTreePathIndexes
      ] = msgTree.getPathUpdate(user1MsgTreeIndex)

      const [
        stateTreePathElements,
        stateTreePathIndexes
      ] = stateTree.getPathUpdate(user1StateTreeIndex)

      // Random leaf is at index 0
      const [
        randomLeafPathElements,
        randomLeafPathIndexes
      ] = stateTree.getPathUpdate(0)

      // Get the vote options tree path elements
      const [
        user1VoteOptionsPathElements,
        user1VoteOptionsPathIndexes
      ] = user1VoteOptionTree.getPathUpdate(user1VoteOptionIndex)

      const curVoteOptionTreeLeafRaw = user1VoteOptionTree.leavesRaw[user1VoteOptionIndex]

      const stateTreeMaxIndex = BigInt(stateTree.nextIndex - 1)

      const user1VoteOptionsTreeMaxIndex = BigInt(stateTree.nextIndex - 1)

      const existingStateTreeLeaf = stateTree.leaves[user1StateTreeIndex]

      const circuitInputs = stringifyBigInts({
        'coordinator_public_key': coordinatorPk,
        'message': user1Message,
        'command': [
          ...user1Command,
          user1CommandSignature.R8[0],
          user1CommandSignature.R8[1],
          user1CommandSignature.S
        ],
        'msg_tree_root': msgTree.root,
        'msg_tree_path_elements': msgTreePathElements,
        'msg_tree_path_index': msgTreePathIndexes,
        'vote_options_leaf_raw': curVoteOptionTreeLeafRaw,
        'vote_options_tree_root': user1VoteOptionTree.root,
        'vote_options_tree_path_elements': user1VoteOptionsPathElements,
        'vote_options_tree_path_index': user1VoteOptionsPathIndexes,
        'vote_options_max_leaf_index': user1VoteOptionsTreeMaxIndex,
        'state_tree_leaf': existingStateTreeLeaf,
        'state_tree_data': user1ExistingStateTreeData,
        'state_tree_max_leaf_index': stateTreeMaxIndex,
        'state_tree_root': stateTree.root,
        'state_tree_path_elements': stateTreePathElements,
        'state_tree_path_index': stateTreePathIndexes,
        'random_leaf': randomPrivateKey(),
        'random_leaf_path_elements': randomLeafPathElements,
        'random_leaf_path_index': randomLeafPathIndexes,
        'no_op': 1n,
        'ecdh_private_key': babyJubJubPrivateKey(coordinatorSk),
        'ecdh_public_key': ephemeralPk
      })

      const wasmBn128 = await buildBn128()
      const zkSnark = groth

      const circuit = new Circuit(updateStateTreeCircuitDef)
      const witness = circuit.calculateWitness(circuitInputs)
      assert(circuit.checkWitness(witness))

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
