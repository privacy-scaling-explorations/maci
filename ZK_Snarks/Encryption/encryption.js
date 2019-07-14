const {babyJub, mimc7} = require("circomlib");

/*
def encrypt(message, sender_privkey, receiver_pubkey):
  iv = 0
  for m in message:
    iv = mimchash(iv, m)
  h = ecmul(sender_privkey, receiver_pubkey).x
  out = [iv]
  for i in range(0, len(message)):
    h = mimchash(h, iv + i)
    out.append(fieldadd(message[i], h))

*/


function encrypt(message, pubkey, privkey) {
  const edh = babyJub.mulPointEscalar(pubkey, privkey)[0];
  const iv = mimc7.multiHash(message, 0n);
  return [iv, ...message.map((e, i)=>e+mimc7.hash(edh, iv+BigInt(i)))];
}

function decrypt(message, pubkey, privkey) {
  const iv = message[0];
  const edh = babyJub.mulPointEscalar(pubkey, privkey)[0];
  return message.slice(1).map((e,i)=>e-mimc7.hash(edh, iv+BigInt(i)));
}

module.exports = {encrypt, decrypt};