# IVerifier

an interface for a Groth16 verifier contract

### verify

```solidity
function verify(uint256[8] _proof, struct SnarkCommon.VerifyingKey vk, uint256 input) external view returns (bool)
```

Verify a zk-SNARK proof

#### Parameters

| Name    | Type                            | Description                      |
| ------- | ------------------------------- | -------------------------------- |
| \_proof | uint256[8]                      | The proof                        |
| vk      | struct SnarkCommon.VerifyingKey | The verifying key                |
| input   | uint256                         | The public inputs to the circuit |

#### Return Values

| Name | Type | Description                                                                                                                                                                                                          |
| ---- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | bool | Whether the proof is valid given the verifying key and public input. Note that this function only supports one public input. Refer to the Semaphore source code for a verifier that supports multiple public inputs. |
