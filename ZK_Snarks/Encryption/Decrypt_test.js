const {proofAndVerify, fload, rand256} = require("../../src/utils.js");
const {babyJub} = require("circomlib");


const assert = require('assert');

const {encrypt, decrypt} = require("./encryption.js");
const generateTestMessage= n=>Array(n).fill(0n).map(x=> rand256()%babyJub.p);

// after(function() {
//   process.exit();
// });

describe("Crypto", ()=>{
  it("decrypt(encrypt(x))==x", ()=>{
    const message = generateTestMessage(10);
    const privkey = rand256() % babyJub.subOrder;
    const pubkey = babyJub.mulPointEscalar(babyJub.Base8, rand256() % babyJub.subOrder);
    const encmessage = encrypt(message, pubkey, privkey);
    assert.deepEqual(decrypt(encmessage, pubkey, privkey), message, "Invalid decrypted message returned.")
  })
})

describe("zkSNARK", ()=>{
  
  it("check verifier for valid proof", async ()=>{
    const decmessage = generateTestMessage(4);
    const privkey1 = rand256() % babyJub.subOrder;
    const privkey2 = rand256() % babyJub.subOrder;
    const pubkey1 = babyJub.mulPointEscalar(babyJub.Base8, privkey1);
    const pubkey2 = babyJub.mulPointEscalar(babyJub.Base8, privkey2);
    const message = encrypt(decmessage, pubkey2, privkey1);
    const input = {message, privkey:privkey2, pubkey:pubkey1, decmessage};

    const {isValid} = await proofAndVerify(
      "./ZK_Snarks/Encryption/Decrypt_test.json",
      "./ZK_Snarks/Encryption/Decrypt_test_pk.json",
      "./ZK_Snarks/Encryption/Decrypt_test_vk.json",
      input);

    assert(isValid, "Proof is invalid.")
  }).timeout(120000)


});