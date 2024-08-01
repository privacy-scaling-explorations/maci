# SnarkCommon

a Contract which holds a struct
representing a Groth16 verifying key

### VerifyingKey

```solidity
struct VerifyingKey {
  struct Pairing.G1Point alpha1;
  struct Pairing.G2Point beta2;
  struct Pairing.G2Point gamma2;
  struct Pairing.G2Point delta2;
  struct Pairing.G1Point[] ic;
}
```
