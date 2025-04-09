# MACI Voting Tasks

This directory contains Hardhat tasks related to voting in MACI polls.

## Tasks

### Vote

The `vote` task allows voting in a deployed MACI poll. This task is useful for testing and interacting with MACI polls directly from Hardhat.

```bash
pnpm hardhat vote --poll-id 0 --privkey <private-key> --state-index 0 --vote-option-index 1 --vote-weight 1
```

#### Parameters

- `--poll-id`: The ID of the poll to vote in
- `--privkey`: The user's private key
- `--state-index`: The user's state index (from signup or joinPoll)
- `--vote-option-index`: The vote option index to vote for
- `--vote-weight`: The weight of the vote
- `--nonce` (optional): The nonce for the vote message (default: 1)
- `--salt` (optional): The salt for the vote message (defaults to random)
- `--maci` (optional): MACI contract address (default: from deployment config)

### Poll Flow

The `poll-flow` task executes a complete MACI poll flow from deployment to proof verification. This is primarily for testing purposes.

```bash
pnpm hardhat poll-flow --privkey <private-key> --vote-option-index 1 --vote-weight 1
```

#### Parameters

- `--privkey`: The user's private key
- `--vote-option-index`: The vote option index to vote for
- `--vote-weight`: The weight of the vote
- `--poll-params` (optional): Poll parameters JSON file path
