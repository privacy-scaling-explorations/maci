const {groth, Circuit} = require("snarkjs");
const {babyJub} = require("circomlib");
const fs = require("fs");
const path = require("path");

const assert = require('assert');

const {encrypt, decrypt} = require("./encryption.js");

function unstringifyBigInts(o) {
  if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
      return BigInt(o);
  } else if (Array.isArray(o)) {
      return o.map(unstringifyBigInts);
  } else if (typeof o == "object") {
      const res = {};
      for (let k in o) {
          res[k] = unstringifyBigInts(o[k]);
      }
      return res;
  } else {
      return o;
  }
}

const fload = f=>unstringifyBigInts(JSON.parse(fs.readFileSync(path.join(__dirname, f))))


function Frand() {
  const p = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  n=0n;
  for(let i=0; i<9; i++) {
    const x = Math.floor(Math.random()*(1<<30));
    n = (n << 30n) + BigInt(x);
  }
  return n % p;
}

const generateTestMessage= n=>Array(n).fill(0n).map(Frand);


describe("Crypto", ()=>{
  it("decrypt(encrypt(x))==x", ()=>{
    const message = generateTestMessage(10);
    const privkey = Frand() % babyJub.subOrder;
    const pubkey = babyJub.mulPointEscalar(babyJub.Base8, Frand() % babyJub.subOrder);
    const encmessage = encrypt(message, pubkey, privkey);
    assert.deepEqual(decrypt(encmessage, pubkey, privkey), message, "Invalid decrypted message returned.")
  })
})

describe("zkSNARK", ()=>{
  
  it("check verifier for valid proof", ()=>{
    const circuit = new Circuit(fload("Decrypt_test.json"));
    const pk = fload("Decrypt_test_pk.json");
    const vk = fload("Decrypt_test_vk.json");
    const decmessage = generateTestMessage(4);
    const privkey1 = Frand() % babyJub.subOrder;
    const privkey2 = Frand() % babyJub.subOrder;
    const pubkey1 = babyJub.mulPointEscalar(babyJub.Base8, privkey1);
    const pubkey2 = babyJub.mulPointEscalar(babyJub.Base8, privkey2);
    const message = encrypt(decmessage, pubkey2, privkey1);
    const input = {message, privkey:privkey2, pubkey:pubkey1, decmessage};
    const witness = circuit.calculateWitness(input);
    const {proof, publicSignals} = groth.genProof(pk, witness);
    assert(groth.isValid(vk, proof, publicSignals), "Proof is invalid.")
  }).timeout(120000)

  it("check verifier for invalid proof", ()=>{
    const circuit = new Circuit(fload("Decrypt_test.json"));
    const pk = fload("Decrypt_test_pk.json");
    const vk = fload("Decrypt_test_vk.json");
    const decmessage = generateTestMessage(4);
    const privkey1 = Frand() % babyJub.subOrder;
    const privkey2 = Frand() % babyJub.subOrder;
    const pubkey1 = babyJub.mulPointEscalar(babyJub.Base8, privkey1);
    const pubkey2 = babyJub.mulPointEscalar(babyJub.Base8, privkey2);
    const message = encrypt(decmessage, pubkey2, privkey1);
    const input = {message, privkey:privkey2, pubkey:pubkey1, decmessage};
    const witness = circuit.calculateWitness(input);
    const {proof, publicSignals} = groth.genProof(pk, witness);
    assert(!groth.isValid(vk, proof, [publicSignals[0]+1n, ...publicSignals.slice(1)]), "Proof is valid.")
  }).timeout(120000)


});