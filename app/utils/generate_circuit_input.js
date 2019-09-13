const { eddsa, mimc7 } = require('circomlib')

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

console.log('tree_root: ' + tree_root.toString())
console.log('final_root: ' + final_root.toString())
console.log('accounts_pubkeys Alice.pubkey[0]: ' + Alice.pubkey[0].toString())
console.log('accounts_pubkeys Alice.pubkey[1]: ' + Alice.pubkey[1].toString())
console.log('accounts_detail: ' + final_root.toString())
console.log('sender_detail: ' + Alice.detail.toString())
console.log('sender_updated_pubkey[0]: ' + newAlice.pubkey[0].toString())
console.log('sender_updated_pubkey[1]: ' + newAlice.pubkey[1].toString())
console.log('sender_updated_detail: ' + newAlice.detail.toString())
console.log("signature['R8'][0]: " + signature.R8[0].toString())
console.log("signature['R8'][1]: " + signature.R8[1].toString())
console.log("signature['S']: " + signature.S.toString())
console.log('aliceHash: ' + aliceHash.toString())
console.log('bobHash: ' + bobHash.toString())
console.log('newAliceHash: ' + newAliceHash.toString())
console.log('txHash: ' + txHash.toString())

const inputs = {
  tree_root: tree_root.toString(),
  accounts_pubkeys: [
    [Alice.pubkey[0].toString(), Alice.pubkey[1].toString()],
    [Bob.pubkey[0].toString(), Bob.pubkey[1].toString()]
  ],
  accounts_detail: [Alice.detail, Bob.detail],
  sender_pubkey: [Alice.pubkey[0].toString(), Alice.pubkey[1].toString()],
  sender_detail: Alice.detail,
  sender_updated_pubkey: [newAlice.pubkey[0].toString(), newAlice.pubkey[1].toString()],
  sender_updated_detail: newAlice.detail,
  signature_R8x: signature.R8[0].toString(),
  signature_R8y: signature.R8[1].toString(),
  signature_S: signature.S.toString(),
  sender_proof: [bobHash.toString()],
  sender_proof_pos: [1]
}

// fs.writeFileSync(
//     "./input.json",
//     JSON.stringify(inputs),
//     "utf-8"
// );
