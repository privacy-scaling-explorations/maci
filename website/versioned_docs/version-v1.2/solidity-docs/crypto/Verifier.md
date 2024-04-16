# Verifier

a Groth16 verifier contract

### Proof

```solidity
struct Proof {
  struct Pairing.G1Point a;
  struct Pairing.G2Point b;
  struct Pairing.G1Point c;
}
```

### PRIME_Q

```solidity
uint256 PRIME_Q
```

### InvalidProofQ

```solidity
error InvalidProofQ()
```

custom errors

### InvalidInputVal

```solidity
error InvalidInputVal()
```

### verify

```solidity
function verify(uint256[8] _proof, struct SnarkCommon.VerifyingKey vk, uint256 input) public view returns (bool isValid)
```

Verify a zk-SNARK proof

#### Parameters

| Name    | Type                            | Description                      |
| ------- | ------------------------------- | -------------------------------- |
| \_proof | uint256[8]                      | The proof                        |
| vk      | struct SnarkCommon.VerifyingKey | The verifying key                |
| input   | uint256                         | The public inputs to the circuit |

#### Return Values

| Name    | Type | Description                                                                                                                                                                                                          |
| ------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| isValid | bool | Whether the proof is valid given the verifying key and public input. Note that this function only supports one public input. Refer to the Semaphore source code for a verifier that supports multiple public inputs. |

### checkPoint

```solidity
function checkPoint(uint256 point) internal pure
```
