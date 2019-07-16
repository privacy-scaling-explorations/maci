const {pk2binary, witness2binary} = require("./binarify.js");
const {groth, Circuit} = require("snarkjs");
const {stringifyBigInts, unstringifyBigInts} = require("snarkjs/src/stringifybigint");
const {buildGroth16} = require("websnark");
const fs = require("fs");

function rand256() {
  n=0n;
  for(let i=0; i<9; i++) {
    const x = Math.floor(Math.random()*(1<<30));
    n = (n << 30n) + BigInt(x);
  }
  return n % (1n<<256n);
}

const fload = f=>unstringifyBigInts(JSON.parse(fs.readFileSync(f)))

let wasmgroth = undefined;

async function proofAndVerify(_circuit, _pk, _vk, _inputs) {
  if(typeof(wasmgroth)==="undefined") 
    wasmgroth = await buildGroth16();
  
  const pk = fload(_pk);
  const vk = fload(_vk);
  
  const circuit = new Circuit(fload(_circuit));
  const witness = circuit.calculateWitness(_inputs);
  const publicSignals = witness.slice(1, circuit.nPubInputs + circuit.nOutputs + 1);
  const proof = unstringifyBigInts(await wasmgroth.proof(witness2binary(witness), pk2binary(pk)));
  proof.protocol = "groth";
  const isValid = groth.isValid(vk, proof, publicSignals);
  return {proof, publicSignals, isValid};
}

module.exports = {proofAndVerify, fload, rand256}