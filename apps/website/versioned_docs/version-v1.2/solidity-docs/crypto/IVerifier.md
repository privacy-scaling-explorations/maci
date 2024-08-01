# IVerifier

an interface for a Groth16 verifier contract

### verify

```solidity
function verify(uint256[8], struct SnarkCommon.VerifyingKey, uint256) public view virtual returns (bool)
```

Verify a zk-SNARK proof
