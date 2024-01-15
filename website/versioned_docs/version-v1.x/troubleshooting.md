---
title: Troubleshooting
description: How to troubleshoot MACI's failures
sidebar_label: Troubleshooting
sidebar_position: 17
---

# Troubleshooting

## cli: `genProofs` command failure

### Case: missing `.dat` files

If your logs look like the following, then make sure you have `ProcessMessages_10-2-1-2_test.dat` and `TallyVotes_10-1-2_test.dat` files in the same directory as your zkeys:

```
node build/ts/index.js genProofs -x 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
>     -sk macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
>     -o 0 \
>     -r ~/rapidsnark/build/prover \
>     -wp ./zkeys/ProcessMessages_10-2-1-2_test \
>     -wt ./zkeys/TallyVotes_10-1-2_test \
>     -zp ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
>     -zt ./zkeys/TallyVotes_10-1-2_test.0.zkey \
>     -t tally.json \
>     -f proofs

fromBlock = 0
Generating proofs of message processing...
terminate called after throwing an instance of 'std::system_error'
  what():  open: No such file or directory
Aborted (core dumped)

terminate called after throwing an instance of 'std::system_error'
  what():  open: No such file or directory
Aborted (core dumped)

Error: could not generate proof.
Error: Error executing ./zkeys/ProcessMessages_10-2-1-2_test /tmp/tmp-9904-zG0k8YPTATWB/input.json /tmp/tmp-9904-zG0k8YPTATWB/output.wtns
    at genProof (/home/ubuntu/maci/circuits/ts/index.ts:44:15)
    at /home/ubuntu/maci/cli/ts/genProofs.ts:339:25
    at step (/home/ubuntu/maci/cli/build/genProofs.js:33:23)
    at Object.next (/home/ubuntu/maci/cli/build/genProofs.js:14:53)
    at fulfilled (/home/ubuntu/maci/cli/build/genProofs.js:5:58)
```

You can generate the missing `.dat` files using the following command:

```bash
pnpm build:circuits-c
```
