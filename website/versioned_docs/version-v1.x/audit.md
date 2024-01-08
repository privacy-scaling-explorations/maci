---
title: MACI Security Audits
description: In the summer of 2022, MACI v1 was audited by HashCloak. The audit covered both the zk-SNARK circuits and the Solidity smart contracts.
sidebar_label: Security Assessments
sidebar_position: 12
---

# Security Audits

## Links

- Audit by HashCloak 2022/09 [report](/audit_reports/202220930_Hashcloak_audit_report.pdf)
- Audit by HashCloak 2021/09 [report](/audit_reports/20210922_Hashcloak_audit_report.pdf)

## HashCloak audit 2022

In the summer of 2022, MACI v1 was audited by HashCloak. The audit covered both the zk-SNARK circuits and the Solidity smart contracts.

This audit revealed a number of high severity issues which have been remediated by the MACI development team. We will be looking at those in details in the following sections.

## Data is not fully verified during a state update

This issue could have allowed a malicious coordinator to change the MACI state arbitrarily, for instance by tampering with the voice credits and the voting public key of any user.

In more details, the `processMessages.circom` circuit, did not fully verify that after a state update, the new state was the result of executing an arbitrary number of user messages on the previous state. `topupStateLeaves` and `topupStateLeavesPathElements` were never verified against the current state, and `topupStateIndexes` and `topupAmounts` were not verified against the message root.

This was rectified with commit [6df6a4054da926b07f35c5befab4f1f8af33dcc6](https://github.com/privacy-scaling-explorations/maci/pull/522/commits/6df6a4054da926b07f35c5befab4f1f8af33dcc6)

## Token for top-up is a free resource

The provided `TopupCredit.sol` contract implemented unprotected `airdrop` and `airdropTo` functions, which could have allowed anyone to receive unlimited voice credits. While this contract was provided as a template, the issue has been rectified by adding the `onlyOwner` modifier to these two functions.

```javascript
function airdropTo(address account, uint256 amount) public onlyOwner {
    require(amount < MAXIMUM_AIRDROP_AMOUNT);
    _mint(account, amount);
}

function airdrop(uint256 amount) public onlyOwner {
    require(amount < MAXIMUM_AIRDROP_AMOUNT, "amount exceed maximum limit");
    _mint(msg.sender, amount);
}
```

## Integer overflow problem and improper bit length restriction

This issue within the `float.circom` circuit could have resulted in an overflow on the `IntegerDivision` template. This stemmed from the lack of validation of input size, as well as not preventing a division by zero. Furthemore, it was pointed out that using assert in circuits did not contribute to constraints verification, and could have been bypassed by a malicious coordinator.

The issue was rectified with commit [efd4617724e956d2566062c6fe882e1d45cba7c4](https://github.com/privacy-scaling-explorations/maci/pull/523/commits/efd4617724e956d2566062c6fe882e1d45cba7c4)

## MessageQueue in PollFactory is uninitialized

MACI uses a message queue (a quinary merkle tree) to store all the messages to be processed for a single poll. When deploying a new poll, a corresponding message queue contract is deployed as well, however this was never initialized with a zero value.

Should the queue never be initialized with the zero value, a malicious user could submit a message to initialize the queue with a value they know how to decrypt, which however would take a very long time to generate a proof for. This could result in a denial of service attack against the coordinator.

The code was fixed by enqueuing a message containing the zero value `NOTHING_UP_MY_SLEEVE` which is the result of:

`keccak256("Maci") % p`

Translated into code, an `init` function was included in the Poll contract, with the following enqueuing of the placeholder leaf:

```javascript
// init messageAq here by inserting placeholderLeaf
uint256[2] memory dat;
dat[0] = NOTHING_UP_MY_SLEEVE;
dat[1] = 0;
(Message memory _message, PubKey memory _padKey, uint256 placeholderLeaf) = padAndHashMessage(dat, 1);
extContracts.messageAq.enqueue(placeholderLeaf);
```

## Additional issues and improvements

The rest of the issues were either low risk, informational or general optimizations.

As an example, there were certain functions which did not enforce the checks-effets-interaction pattern, which could potentially have led to reentrancy attacks. While most of these have been fully remediated, the `deployPoll` function within MACI is not currently enforcing the pattern when deploying a new poll contract using the `PollFactory` factory contract.

```javascript
function deployPoll(
    uint256 _duration,
    MaxValues memory _maxValues,
    TreeDepths memory _treeDepths,
    PubKey memory _coordinatorPubKey
) public afterInit {
    uint256 pollId = nextPollId;

   [..snip]

    Poll p = pollFactory.deploy(
        _duration,
        _maxValues,
        _treeDepths,
        batchSizes,
        _coordinatorPubKey,
        vkRegistry,
        this,
        topupCredit,
        owner()
    );

    polls[pollId] = p;

    emit DeployPoll(pollId, address(p), _coordinatorPubKey);
}
```

As seen above, an external call is made, before updating the state with the new poll. The issue is tracked [here](https://github.com/privacy-scaling-explorations/maci/pull/522#discussion_r981863147) and only left open as the code does not enforce best practices, however it does not pose any immediate risk.

The rest of the issues were successfully fixed and reflected in the v1.1.1. For the full report, please refer to the `audit` folder inside the root of the repository.

## Veridise disclosure 2023

In March 2023, Veridise responsibly disclosed a number of issues to the MACI team, which were identified using their new [tool](https://twitter.com/VeridiseInc/status/1630806464695791616?s=20) for catching ZK circuit bugs.

Out of five issues disclosed, only three were relevant and have been since fixed by the MACI team. The other two issues were disregarded as they were present in older version of code which is not in use anymore.

We would like to thank you the Veridise team for their effort in keeping open source projects safe.

> Please note that at this time the fixed code is only present in the dev branch. This will be merged to the main branch in the next minor update.

### Issue 1

**Description**

In the template `QuinSelector`, if you want to confirm the input signal index is a valid integer less than 2\*\*3, you should add Num2bits(3) to check it.

**Code Location**

[`incrementalQuinTree.circom`](https://github.com/privacy-scaling-explorations/maci/blob/78609349aecd94186216ac8743d61b1cb81a097f/circuits/circom/trees/incrementalQuinTree.circom#L30)

**Fix**

[Code location](https://github.com/chaosma/maci/blob/60727d4d10406edda32ad28e53d399d41d45ed88/circuits/circom/trees/incrementalQuinTree.circom#L37)

```javascript
// Ensure that index < choices
component lessThan = SafeLessThan(3);
```

This was fixed by adding a new Template, `SafeLesThan` which uses `Num2Bits` as further check on the signals:

```javascript
// the implicit assumption of LessThan is both inputs are at most n bits
// so we need add range check for both inputs
template SafeLessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component n2b1 = Num2Bits(n);
    n2b1.in  <== in[0];
    component n2b2 = Num2Bits(n);
    n2b2.in  <== in[1];

    component n2b = Num2Bits(n+1);

    n2b.in <== in[0]+ (1<<n) - in[1];

    out <== 1-n2b.out[n];
}
```

### Issue 2

**Description**

This issue is the same issue number 1, this time for the input signal index.

**Code Location**

[`incrementalQuinTree.circom`](https://github.com/privacy-scaling-explorations/maci/blob/78609349aecd94186216ac8743d61b1cb81a097f/circuits/circom/trees/incrementalQuinTree.circom#L64)

**Fix**

[PR with fix](https://github.com/privacy-scaling-explorations/maci/pull/646/files#diff-f3ad1f61e9b95b88929664b67c873325fdf70cb8569c2a96da4b0e9f02710391)

As with issue number 1, a new template `SafeGreaterThan` was added:

```javascript
// N is the number of bits the input  have.
// The MSF is the sign bit.
template SafeGreaterThan(n) {
    signal input in[2];
    signal output out;

    component lt = SafeLessThan(n);

    lt.in[0] <== in[1];
    lt.in[1] <== in[0];
    lt.out ==> out;
}
```

And then used it to constrain the [`index` input signal](https://github.com/chaosma/maci/blob/2d7a3a0efd33dfc3a5f4d3f95bec3adda7abb963/circuits/circom/trees/incrementalQuinTree.circom#L115-L117):

```javascript
greaterThan[i] = SafeGreaterThan(3);
greaterThan[i].in[0] <== i;
greaterThan[i].in[1] <== index;
```

### Issue 3

**Description**

In the template `QuinGeneratePathIndices`, the constrains of the `signal n[levels + 1]` don't perform well for division and modulo counting.

**Code Location**

[`incrementalQuinTree.circom`](https://github.com/privacy-scaling-explorations/maci/blob/7c1b3743ea753786011289a356eaa45ba72f9ca1/circuits/circom/trees/incrementalQuinTree.circom#L228-L242)

**Fix**

The [updated code](https://github.com/chaosma/maci/blob/2d7a3a0efd33dfc3a5f4d3f95bec3adda7abb963/circuits/circom/trees/incrementalQuinTree.circom#L285-L290) uses the `SafeLessThen` template, as shown below:

```javascript
for (var i = 0; i < levels; i++) {
    // Check that each output element is less than the base
    leq[i] = SafeLessThan(3);
    leq[i].in[0] <== out[i];
    leq[i].in[1] <== BASE;
    leq[i].out === 1;

    // Re-compute the total sum
    sum.nums[i] <== out[i] * (BASE ** i);
}
```
