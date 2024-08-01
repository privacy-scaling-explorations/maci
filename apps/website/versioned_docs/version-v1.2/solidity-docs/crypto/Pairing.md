# Pairing

A library implementing the alt_bn128 elliptic curve operations.

### PRIME_Q

```solidity
uint256 PRIME_Q
```

### G1Point

```solidity
struct G1Point {
  uint256 x;
  uint256 y;
}
```

### G2Point

```solidity
struct G2Point {
  uint256[2] x;
  uint256[2] y;
}
```

### PairingAddFailed

```solidity
error PairingAddFailed()
```

custom errors

### PairingMulFailed

```solidity
error PairingMulFailed()
```

### PairingOpcodeFailed

```solidity
error PairingOpcodeFailed()
```

### negate

```solidity
function negate(struct Pairing.G1Point p) internal pure returns (struct Pairing.G1Point)
```

The negation of p, i.e. p.plus(p.negate()) should be zero.

### plus

```solidity
function plus(struct Pairing.G1Point p1, struct Pairing.G1Point p2) internal view returns (struct Pairing.G1Point r)
```

r Returns the sum of two points of G1.

### scalarMul

```solidity
function scalarMul(struct Pairing.G1Point p, uint256 s) internal view returns (struct Pairing.G1Point r)
```

r Return the product of a point on G1 and a scalar, i.e.
p == p.scalarMul(1) and p.plus(p) == p.scalarMul(2) for all
points p.

### pairing

```solidity
function pairing(struct Pairing.G1Point a1, struct Pairing.G2Point a2, struct Pairing.G1Point b1, struct Pairing.G2Point b2, struct Pairing.G1Point c1, struct Pairing.G2Point c2, struct Pairing.G1Point d1, struct Pairing.G2Point d2) internal view returns (bool isValid)
```

#### Return Values

| Name    | Type | Description                                                                                                                                                           |
| ------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| isValid | bool | The result of computing the pairing check e(p1[0], p2[0]) _ .... _ e(p1[n], p2[n]) == 1 For example, pairing([P1(), P1().negate()], [P2(), P2()]) should return true. |
