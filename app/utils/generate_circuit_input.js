// @flow

const provingKey = require('../circuits/proving_key.json')
const verificationKey = require('../circuits/verification_key.json')
const circuitDef = require('../circuits/circuit.json')
const { eddsa, mimc7 } = require('circomlib')
const { Circuit } = require('snarkjs')
const zkSnark = require('snarkjs').original
const { unstringifyBigInts } = require('snarkjs/src/stringifybigint')

const alicePrvKey = Buffer.from('1'.toString().padStart(64, '0'), 'hex')
const alicePubKey = eddsa.prv2pub(alicePrvKey)
const bobPrvKey = Buffer.from('2'.toString().padStart(64, '0'), 'hex')
const bobPubKey = eddsa.prv2pub(bobPrvKey)

// accounts (1 = Yes, 0 = No)
const Alice = {
  pubkey: alicePubKey,
  detail: 1
}

const aliceHash = mimc7.multiHash(
  [Alice.pubkey[0], Alice.pubkey[1], BigInt(Alice.detail)]
)

const Bob = {
  pubkey: bobPubKey,
  detail: 0
}
const bobHash = mimc7.multiHash(
  [Bob.pubkey[0], Bob.pubkey[1], BigInt(Bob.detail)]
)

const tree_root = mimc7.multiHash([aliceHash, bobHash])

// transaction
const tx = {
  from: Alice.pubkey,
  detail: 0,
  updated_pubkey: Alice.pubkey
}

// Alice sign tx
const txHash = mimc7.multiHash(
  [tx.from[0], tx.from[1], BigInt(tx.detail), tx.updated_pubkey[0], tx.updated_pubkey[1]]
)
const signature = eddsa.signMiMC(alicePrvKey, txHash)

// update Alice account
const newAlice = {
  pubkey: tx.updated_pubkey,
  detail: BigInt(tx.detail)
}
const newAliceHash = mimc7.multiHash(
  [newAlice.pubkey[0], newAlice.pubkey[1], BigInt(newAlice.detail)]
)

// update root
const final_root = mimc7.multiHash([newAliceHash, bobHash])

// console.log('tree_root: ' + tree_root.toString())
// console.log('final_root: ' + final_root.toString())
// console.log('accounts_pubkeys Alice.pubkey[0]: ' + Alice.pubkey[0].toString())
// console.log('accounts_pubkeys Alice.pubkey[1]: ' + Alice.pubkey[1].toString())
// console.log('accounts_detail: ' + final_root.toString())
// console.log('sender_detail: ' + Alice.detail.toString())
// console.log('sender_updated_pubkey[0]: ' + newAlice.pubkey[0].toString())
// console.log('sender_updated_pubkey[1]: ' + newAlice.pubkey[1].toString())
// console.log('sender_updated_detail: ' + newAlice.detail.toString())
// console.log("signature['R8'][0]: " + signature.R8[0].toString())
// console.log("signature['R8'][1]: " + signature.R8[1].toString())
// console.log("signature['S']: " + signature.S.toString())
// console.log('aliceHash: ' + aliceHash.toString())
// console.log('bobHash: ' + bobHash.toString())
// console.log('newAliceHash: ' + newAliceHash.toString())
// console.log('txHash: ' + txHash.toString())

const circuitInput = {
  tree_root: tree_root,
  accounts_pubkeys: [
    Alice.pubkey,
    Bob.pubkey
  ],
  // accounts_detail: [Alice.detail, Bob.detail],
  sender_pubkey: [Alice.pubkey[0], Alice.pubkey[1]],
  sender_detail: Alice.detail,
  sender_updated_pubkey: [newAlice.pubkey[0], newAlice.pubkey[1]],
  sender_updated_detail: newAlice.detail,
  signature_R8x: signature.R8[0],
  signature_R8y: signature.R8[1],
  signature_S: signature.S,
  sender_proof: [bobHash],
  sender_proof_pos: [1]
}

const circuit = new Circuit(circuitDef)

console.log('Calculating witnesses....')
const witness = circuit.calculateWitness(circuitInput)

console.log('Generating proof....')
const { proof, publicSignals } = zkSnark.genProof(
  unstringifyBigInts(provingKey), witness
)

const isValid = zkSnark.isValid(
  unstringifyBigInts(verificationKey),
  proof,
  publicSignals
)

console.log(`Inputs passes circuit: ${isValid}`)
