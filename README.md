# Polychain Monsters On-Chain Battles

![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/polychainmon) [![License](https://img.shields.io/badge/license-Apache%202-blue)](LICENSE)

## Introduction

This is a first approach for building fun on-chain monster battles on EVM compatible chains. This repo is work in progress and there might be lots of bugs and improvement potential. Feel free to contribute! Will will not spend too much time writing a proper documentation until the game sees some traction.

## Fully On-Chain Battles

In our on-chain game, every battle move, including attacks, defenses, and other actions, is recorded on the blockchain. This setup means that when one player submits a move on-chain, their opponent (who could be a bot) can simply monitor all on-chain activities and choose a move that will counter the action of their adversary. To prevent this, we are implementing a commit-and-reveal scheme. Both players first commit their moves, and then, once both moves are committed, they reveal them. This approach ensures that no player can track the other's moves beforehand. The logic for this is implemented in the MatchMakerV3 contract, specifically within the commit and reveal functions.

We questioned whether it was possible to simplify the complexity of the smart contracts. This inquiry led us to discover Oasis Sapphire. Sapphire is the first and only confidential EVM that enhances Web3 with Smart Privacy.

### Confidential Battles on Oasis Sapphire

[Oasis Sapphire](https://oasisprotocol.org/sapphire) enables us to eliminate the complex commit-and-reveal logic in the smart contracts. It offers RPCs that handle encrypted transactions and maintain encrypted states within smart contracts. Consequently, players can submit their moves in an encrypted manner without needing to reveal them later. This simplification not only reduces the complexity on the smart contract side but also streamlines frontend handling, leading to fewer bugs.

The implementation of this novel approach to on-chain battles is located in the `MatchMakerV3Confidential` contract. Specifically, the `authenticated` modifier and the reveal function are noteworthy components to examine.

## License

This project is licensed under the Apache 2 License - see the [LICENSE](LICENSE) file for details
