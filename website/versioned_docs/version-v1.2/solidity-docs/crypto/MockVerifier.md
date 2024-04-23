# MockVerifier

a MockVerifier to be used for testing

### verify

```solidity
function verify(uint256[8], struct SnarkCommon.VerifyingKey, uint256) public pure returns (bool result)
```

Verify a zk-SNARK proof (test only return always true)

#### Return Values

| Name   | Type | Description                                                   |
| ------ | ---- | ------------------------------------------------------------- |
| result | bool | Whether the proof is valid given the verifying key and public |
