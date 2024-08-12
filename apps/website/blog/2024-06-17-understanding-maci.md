---
slug: maci-for-beginners
title: Understanding MACI - A Beginner's Guide to Private On-Chain Voting
description: An introduction to MACI's
authors:
  name: Vee
  title: MACI contributor
  url: https://github.com/Vee-18
  image_url: /img/pse-logo-round.png
tags: [maci, voting, history, vitalik]
excerpt: "In this blog post, we’ll give a high-level, beginner friendly introduction of what Minimal Anti-Collusion Infrastructure (MACI) is, and how it could be used in a real-world context. We’ll take you through the essentials of MACI, making complex concepts accessible regardless of your background in the blockchain space."
---

Hey Anon!

In this blog post, we’ll give a high-level, beginner friendly introduction of what Minimal Anti-Collusion Infrastructure (MACI) is, and how it could be used in a real-world context. We’ll take you through the essentials of MACI, making complex concepts accessible regardless of your background in the blockchain space.

## What is MACI?

MACI is a cutting-edge solution that ensures private, reliable voting on the blockchain.

## Blockchain Voting Challenges for Beginners

On-chain voting is a method of casting votes directly on the blockchain, leveraging its decentralized and transparent nature. While this provides us with censorship resistance and guarantees correct execution, the transparency of blockchains can be a double-edged sword. Given all transaction data is public by default, it means everyone can see how anyone voted. This ensures all votes are correctly counted but the visibility could lead to undue influence on voters' decisions, and potentially opens doors for unethical practices like voter bribery. The challenge, therefore, lies in preserving the privacy of each vote while maintaining the core principles of blockchain: transparency, process integrity, and security.

## How MACI Offers a Solution

Minimal Anti-Collusion Infrastructure, or MACI, steps in as an elegant solution to these challenges. Despite operating on-chain, it protects the privacy of voters and votes, thereby significantly reducing the chances of vote manipulation through bribery. How does it achieve this? By employing advanced cryptographic techniques like zero-knowledge proofs (zk-SNARKs), **MACI ensures that while the outcome of the vote is public and transparent, individual voting choices remain private**. For instance, let's say you vote in an election using MACI, you could claim to everyone that you voted for a particular candidate, but in reality, you might have voted for someone else. There's no way for anyone to verify your claim, making bribery less appealing.

## Key Features of MACI

MACI isn't just a tool; it's a fortress safeguarding the integrity of on-chain voting. Let's break down its key features:

- **Collusion Resistance**: MACI makes it virtually impossible for voters to be swayed by bribes, as they can't prove how they voted.
- **Privacy**: Your vote is your secret. Only you know where your support lies, thanks to the encryption technology MACI employs.
- **Uncensorability**: Every vote counts and cannot be blocked, edited or removed, ensuring a fair voting process.
- **Unforgeability**: Your vote is tied to your unique digital identity, preventing anyone else from casting a vote in your place.
- **Non-repudiation**: Once cast, your vote is set in stone. You can change your mind and vote again, but you can't erase your previous vote.
- **Correct Execution**: The final tally is accurate and tamper-proof, ensuring that the true voice of the voting population is heard.

These features come together to create a voting environment where your voice is heard, loud and clear, without fear of external influence or manipulation.

## Technical Overview Simplified

At its heart, MACI is built on Ethereum, a blockchain platform. This foundation provides a high level of security and trust. The real magic, however, lies in something called zk-SNARKs. Think of zk-SNARKs as a cloak of invisibility for your vote; they hide your voting choices while still guaranteeing the overall vote count to be tallied accurately. This blend of Ethereum's robust framework and the innovative use of zk-SNARKs makes MACI a reliable and secure choice for on-chain voting, ensuring that your vote is both private and counted.

If you’re interested in more of the technical details, check out the MACI documentation.

## Real-World Applications and Limitations

Imagine a world where funding for public goods, like community projects or open-source software, is decided through fair and transparent voting. This is where MACI shows its true potential. [Quadratic funding](https://qf.pse.dev/quadratic-funding) is already harnessing MACI's capabilities to enhance user privacy and discourage any form of collusion in funding decisions.

However, like any system, MACI isn't perfect. Its effectiveness hinges on the honesty of the coordinator – the entity or person overseeing the voting process and tallying the results. A dishonest coordinator could pose risks, but thankfully, MACI is designed to minimise even this possibility, maintaining a high level of integrity in the voting process.

## Conclusion

As we've explored, Minimal Anti-Collusion Infrastructure (MACI) stands as a testament to the innovative solutions being developed in the blockchain space, especially for those new to this technology. It addresses the critical need for privacy and fairness in on-chain voting, ensuring that your vote remains your own, free from external pressures and manipulation.

Blockchain technology is continually evolving, and with tools like MACI, it's becoming more accessible and trustworthy. Whether you're a blockchain enthusiast, a developer, or someone just starting to explore this exciting field, MACI represents a significant step forward in creating a more democratic and transparent digital world.

We encourage you to delve deeper into MACI and the broader world of blockchain by reading through our [documentation](https://maci.pse.dev/docs/introduction) and installing MACI. Join us too on our [Discord](https://discord.com/invite/sF5CT5rzrR) to report any bugs or to chat with our team. Your involvement can help shape a future where digital voting is not just secure, but also truly representative of the people's voice.

Together, let's embrace these advancements and contribute to a fairer, more transparent digital voting landscape.
