---
slug: anonymous-poll-joining
title: Anonymous Poll Joining
description: Efficient protocol with more anonymity and no more message trees. Another protocol upgrade from 3327.io kitchen.
authors:
  name: Aleksandar
  title: 3327 Lead Researcher
  url: https://github.com/aleksandar-veljkovic
  image_url: https://avatars.githubusercontent.com/u/97948247?s=200&v=4
tags: [maci, anonymity, poll, joining]
---

### Why poll joining?

In the original version of the MACI protocol, one state tree stored information about all registered users, their public key, number of credits, and registration timestamp. Users could vote using encrypted messages and change keys to mitigate potential bribes. However, the coordinator could still decrypt messages and track key changes. Even if the key was changed and the bribed users could cancel their previous votes by voting with their new key, the coordinator could still trace back the key-changing messages and determine the true votes of the bribed users. To remove the link between the original public key and the new, changed public key, we've implemented [El Gamal modification](https://github.com/privacy-scaling-explorations/maci/tree/feat/elgamal) of the protocol. This modification worked, but it was expensive from the contract side and introduced a big overhead to the protocol in general.

Even if the El Gamal modification was not the most efficient one, it pointed in the right direction where each user should get a new key for each poll and hide the link with their original key using ZK proofs. That is why we decided to follow that path and improve the protocol further. We introduced a new concept of [poll joining](https://github.com/privacy-scaling-explorations/maci/tree/feat/anon-poll-joining).

### What is poll joining?

Poll joining represents a protocol change where each poll contains its own poll state tree that stores the keys of users who want to vote on that poll. The users join the poll by providing a new key that they will use in that specific poll. But wait, then anyone can create as many keys as they like and vote many times so we lose everything? Not really. The users submit their new public key and ZK proof that they own some key in the original MACI state tree. That way, only registered users can join the polls without revealing the link between the old and the new key. To prevent multiple joins, the user also provides a nullifier - computed as a hash of their private key. The submitted ZK proof also verifies that the nullifier is correctly computed from the same private key associated with the public key in the original MACI state tree. On the smart contract side, the user is prevented from joining the poll with an already spent nullifier.

What if some users have a very specific number of credits so they reveal themselves by giving the same number of credits to a new key? We have a solution for that also. The users submit their new desired credit balance which has to be less than or equal to their credit balance associated with the original key in the MACI state tree. The submitted ZK proof also verifies that this condition is valid. Furthermore, a poll can be created so that it sets balances for all keys to a constant value, completely keeping anonymity.

### How does poll joining affect the protocol?

The poll joining does introduce one extra step for the user. Besides that, all functions and circuits on the coordinator's side remain intact. However, poll joining introduces new interesting features for the MACI as it enables putting various conditions on who can join the poll and how their credits are transformed in each poll. Some polls may require a minimum number of credits for joining, others may put a cap on the number of credits to be spent in a poll. The new dynamics open a new world of possibilities for future updates. But wait, there is more!

### What else was improved?

Besides poll joining we have introduced a new feature that drastically lowered the overall cost of the protocol. Before we reveal what was the upgrade, we should first recap how the protocol worked in the original version, specifically the message processing. In the original protocol, users submitted their messages to the Poll smart contract. Each message was stored in a smart contract Merkle tree, the accumulator queue to be precise. At the end of the voting period, the coordinator had to merge the message tree by sending multiple merging messages for data structure subtrees so the final message root could be computed. When the message route was computed, the coordinator used inclusion proofs in the message processing circuit to prove that each processed message was indeed found in the message tree. This sounds like a really expensive procedure - because it was. Let's analyze what could be improved.

First, all messages need to be processed in the same order that they were submitted to the poll contract. Using a tree structure and inclusion proofs does indeed prove that, but if there only was a data structure that maintains the order of items in a given immutable order? Yes, you guessed it, it is Blockchain. Each block in the chain stores an immutable reference to a previous block, keeping the order. It sounds like we have to make the message object even more complex and keep the reference to the previous message, but that is not the way. We can start with a random value, a hash of an initial string, and call it a chain hash. When there are no messages, the chain hash keeps the initial value. Once a new message comes to the poll, we can compute the message hash (already done for the message tree in the original protocol) and update the chain hash to a hash value of the current chain hash and newly received message hash. Formally, $$chainHash_i = hash(chainHash_{i-1}, messageHash_i)$$

Second, the coordinator collects all messages from the smart contract events, so why should we explicitly store messages in the smart contract? With the chain hash approach - we don't. When the coordinator is processing messages, the only important thing for making sure that the messages are properly ordered and all messages are included is to check that the chain hash is correctly computed. Starting with an initial chain hash value we can process messages and incrementally update the chain hash in the circuit ending up with a value that has to match the last chain hash value in the smart contract. To optimize this procedure for batch message processing, we explicitly store chain hashes for each batch in the smart contract and verify the batch processing by submitting the chain hash values before and after the message batch. We can dynamically set the size of the batch, thus the number of stored batch chain hashes, based on the coordinator's processing power.

### How efficient is this?

We removed the entire message accumulator data structure that had exponential space complexity in the number of messages and introduced batch chain hashes of a linear space complexity with a constant of less than one. That resulted in removing the entire message merging step, executed multiple times until the tree was merged. We kept the high level of user anonymity but without the large overhead of the El Gamal approach. We have maybe introduced one extra step for the user to join the poll, but we also removed many steps of message processing and drastically lowered the costs for the coordinator. Not bad.

### What is next?

We are not stopping here, more interesting protocol upgrades are on the way that would improve the security of the protocol even further and eliminate another significant concern. Be patient, and enjoy the privacy!

### Who are we?

Visit 3327.io and find out. Special kudos to our [Mihailo Radojević](https://github.com/radojevicMihailo) and [Boris Cvitak](https://github.com/djanluka) who did a lot of heavy lifting so these cool features could be here today!
