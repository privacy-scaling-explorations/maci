---
title: Public Goods Funding
description: Overview of public goods funding.
sidebar_label: Public Goods Funding
sidebar_position: 2
---

# What is Public Goods Funding?

Think crowdfunding and grant-giving where the community weighs the contribution of each project and decides how much of financial funding said project should receive.

There are different flavors of funding mechanisms, you can find more information about each of them below:

- [Simple Percentage](#simple-voting)
- [Quadratic Funding](#quadratic-funding)
- [Retroactive Public Goods Funding](#retroactive-public-goods-funding)

## Simple Voting

Public goods funding through a Simple Voting mechanism involves a pool of funds that is allocated based on the outcomes of a straightforward voting process. The percentage of votes received determines the corresponding percentage of the pool distributed.

While Simple voting makes sense for some cases, we suggest using Quadratic Funding for more fair model. You can read more [here](#quadratic-funding-a-better-balance).

## Quadratic Funding

Quadratic funding (QF) is a crowdfunding mechanism that aims to distribute funds in a way that is more fair and inclusive than traditional crowdfunding. It works by matching small individual contributions with matching funds from a larger pool, using a quadratic formula.

In a QF round, donors are incentivized to contribute money to a project or cause that they support. The matching funds are then distributed to the projects that receive the most support from the largest number of people. This helps to ensure that smaller, grassroots projects can receive funding and support, even if they don't have access to large donors or corporate sponsors.

The quadratic formula used in this type of funding means that the matching funds increase exponentially with the number of individual contributors, which helps to amplify the impact of smaller donations and create a more equitable distribution of funds. This makes it possible for projects with a large number of small supporters to receive more funding than projects with just a few large supporters, which helps to level the playing field for smaller and less well-funded initiatives.

Quadratic funding is made up of:

1. a pool of funds to be distributed
2. a voting system for distributing those funds

Two common voting systems you may have used are 1-person-1-vote and 1-dollar-1-vote. Quadratic funding is a best-of-both-worlds solution where users vote with the **square root** of the money they spend — read on to learn more.

### Quadratic Funding: a better balance?

Quadratic funding is a compromise between 1-dollar-1-vote and 1-person-1-vote. Participants vote on how to distribute pooled funds by making individual donations, but each person's influence, rather than being the amount of money they spend, is the square root of that amount.

Compared to 1-dollar-1-vote in the market, quadratic funding makes it exponentially easier for the influence of many poorer people to outweigh that of a single rich person:

- 1-dollar-1-vote: 1 person paying \$10,000 has the same influence as 100 people paying \$100
- Quadratic funding: 1 person paying \$10,000 has the same influence as 100 people paying \$1 or 10 people paying \$100

Compared to 1-person-1-vote, quadratic funding lets the person who lives in Florida full-time, and cares twice as much about the vote's outcome than the person who lives in Florida half-time, have more influence:

- 1-person-1-vote: the two Florida voters have equal influence
- Quadratic funding: the full-time Florida resident, who cares twice as much, pays twice as much, and as a result gets 2^(1/2) times the influence of the half-time resident

(It's important to note that while these example are a good demonstration of the argument for quadratic funding, they do over-simplify these situations, which are as sociological as they are mathematical.)

### Quadratic Funding Resources

- [Quadratic Payments: A Primer](https://vitalik.eth.limo/general/2019/12/07/quadratic.html)
- [Liberal Radicalism: A Flexible Design For Philanthropic Matching Funds](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3243656)
- [Quadratic Voting](https://www.radicalxchange.org/concepts/plural-voting/)

## Retroactive Public Goods Funding

Retroactive Public Goods Funding (Retro Funding) is based on the idea that it’s easier to agree on what was useful in the past than what might be useful in the future. Originally was designed by Vitalik and a simple early version implemented by Optimism Foundation. You can read the original post [here](https://medium.com/ethereum-optimism/retroactive-public-goods-funding-33c9b7d00f0c).

An implementation of Retro Funding with MACI is similar as using Quadratic Funding or Simple Majority, with the difference that the selected projects need to present what they have done and voters assign funds based on results.
