# Security Audit 2022 

In the summer of 2022, MACI v1 was audited by HashCloak. The audit covered both the zk-SNARK circuits and the Solidity smart contracts.

This audited revealed a number of high severity issues which have been remediated by the MACI development team. We will be looking at those in details in the following sections.

## Data is not fully verified during a state update

This issue could have allowed a malicious coordinator to change the MACI state arbitrarly, for instance by tampering with the voice credits and the voting public key of any user. 

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

This issue within the `float.circom` circuit could have resulted in a overflow on the `IntegerDivision` template. This stemmed from the lack of validation of input size, as well as not preventing a division by zero. Furthemore, it was pointed out that using assert in circuits did not contribute to constraints verification, and could have been bypassed by a malicious coordinator. 

The issue was rectified with commit [efd4617724e956d2566062c6fe882e1d45cba7c4](https://github.com/privacy-scaling-explorations/maci/pull/523/commits/efd4617724e956d2566062c6fe882e1d45cba7c4)

## MessageQueue in PollFactory is uninitialized 

MACI uses a message queue (a quinary merkle tree) to store all the messages to be processed for a single poll. When deploying a new poll, a corresponding message queue contract is deployed as well, however this was never initialized with a zero value. 

Should the queue never be initialized with the zero value, a malicious user could submit a message to initialize the queue with a value they know how to decrypt, which however would take a very long time to generate a proof for. This could result in a denial of service attack against the coordinator. 

The code was fixed by enqueing a message containing the zero value `NOTHING_UP_MY_SLEEVE` which is the result of:

`keccak256("Maci") % p`

Transalted into code, an `init` function was included in the Poll contract, with the following enqueing of the placeholder leaf:

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

As an example, there were certain functions which did not enforce the checks-effets-interaction pattern, which could potentially have led to reentrancy attacks. While most of these have been fully remediated, the `deployPoll` function within MACI is not currently enfocing the pattern when deploying a new poll contract using the `PollFactory` factory contract.

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

The rest of the issues were succesffuly fixed and reflected in the v1.1.1. For the full report, please refer to the `audit` folder inside the root of the repository.