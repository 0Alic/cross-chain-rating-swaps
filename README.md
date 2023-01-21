# Cross-chain atomic swap of ratings and rewards

This repository is a simple implementation of an atomic swap of ratings for rewards assuming a rating system deployed on two blockchains: one to handle the payments and the other handling the ratings.

The high level workflow is the following:
- Carl owns a restaurant and Alice eats there;
- Carl sets Alice's bill to paid with cryptocurrency;
- When Alice pays, Carl grants her a permission to rate his restaurant;
- When she rats Carl's restaurant, she receives a reward (e.g. a small number of ETH).

The idea is to split the system into two blockchains and connect the operations above with atomic cross-chain swaps [Herlihy].

The operations can be split into two exchanges (or swaps):
- Alice exchanges her payment for the permission to rate (Payment-Permission);
- Alice exchanges her rating for a reward (Rating-Reward).

Each exchange can be implemented with Hash Time Locked Contracts (HTLCs).

## Contracts

The smart contracts are in Solidity within a Truffle working environment.

The smart contracts are a re-adaptation of Alessandro Mazzarella's bachelor thesis.

There are 4 type of HTLCs:
- Payment-Permission HTLCs:
- - Usr_Pay_Perm: is the HTLC Alice, the customer or user, deploys to promise her payment towards Carl;
- - Res_Pay_Perm: is the HTLC Carl, the restaurant owner, deploys to promise the permission to rate towards Alice.

- Rating-Reward HTLCs:
- - Usr_Rev_Rew: is the HTLC Alice deploys to promise her rating towards Carl's restaurant;
- - Res_Rev_Rew: is the HTLC Carl deploys to promise the reward toward Alice.

A Rating smart contract collects the permissions and the ratings. To allow the HTLCs to store permissions and ratings, Carl, the Rating's owner, needs to approve the HTLCs.

## How to run

Simulate two blockchains with two ganache instances: one listening to port 8545 (default) and the other listening to port 7545.

    ganache -p 8545
    ganache -p 7545

The script `test.js` shows how to connect to the two ganaches and the operations flow. The script also stores the gas costs of the operations in `gasCosts.csv`.

## References
[Herlihy] Maurice Herlihy. 2018. Atomic Cross-Chain Swaps. In Proceedings of the 2018 ACM Symposium on Principles of Distributed Computing (PODC '18). Association for Computing Machinery, New York, NY, USA, 245–254. https://doi.org/10.1145/3212734.3212736