# Feature: Hardhat task for voting in a deployed poll

## Description

This PR adds a new Hardhat task that allows users to vote in a deployed MACI poll directly from the command line. This completes the workflow of deploying, voting, merging, and proving through Hardhat tasks, eliminating the need for a UI during development and testing.

## Related Issue

Resolves #1997

## Changes Made

- Created a new Hardhat task `vote` in `packages/contracts/tasks/runner/vote.ts`
- Added the task to the hardhat.config.ts imports
- Added npm scripts for the vote task for various networks
- Added documentation for the vote task in `packages/contracts/docs/voting.md`

## Implementation Details

The new task allows users to:
- Vote in a deployed poll by specifying poll ID, state index, vote option, and vote weight
- Provide their MACI private and public keys for authentication
- Optionally specify a salt for the vote (or have one generated)
- Track transaction costs

The implementation follows the pattern established by other MACI tasks and uses the MACI libraries properly for creating encrypted votes.

## How to Test

1. Deploy a MACI instance:
```bash
pnpm deploy:localhost
```

2. Deploy a poll:
```bash
pnpm deploy-poll:localhost
```

3. Vote in the poll (make sure to replace the keys with valid ones):
```bash
pnpm vote:localhost \
  --poll 0 \
  --state-index 1 \
  --vote-option-index 1 \
  --vote-weight 5 \
  --nonce 0 \
  --maci-priv-key "macisk.xxxx" \
  --maci-pub-key "macipk.xxxx"
```

4. Continue with the regular merge and prove tasks:
```bash
pnpm merge:localhost --poll 0
pnpm prove:localhost --poll 0 [other required args]
```

## Checklist

- [x] My code follows the style guidelines of this project
- [x] I have squashed any "temp" commits
- [x] I have added relevant documentation
- [x] My changes generate no new warnings or errors
- [x] I have made corresponding changes to the documentation
- [x] My PR is targeting the `dev` branch 