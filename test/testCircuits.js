const createBlakeHash = require('blake-hash')

const b = createBlakeHash('blake512')

const bytes = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

const buf = Buffer.from(bytes, 'hex')

b.update(buf)

console.log(b.digest().toString('hex'))