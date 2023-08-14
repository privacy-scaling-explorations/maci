# How to read the documentation

This (meta) document explains how to read the documentation in the repository depending on what you want to find out about MACI.

## README (root)

[README](../README.md) document in the root provides a step-by-step guide on how to install all dependencies and set up a local infrastructure for development and/or testing. The document also provides links to other specific installation documents.

## Docs folder

### README

[README](./README.md) document in the docs folder provides a brief introduction to MACI and outlines the protocol's key features and concepts.

### Installation

[Installation](./installation.md) document guides you through the installation of the software required for running MACI (e.g., radpidsnark, generation of zKey files). It is related to the [README](../README.md) root document.

### Testing

[Testing](./testing.md) document outlines the process of test execution.

### Primitives

[Primitives](./installation.md) document defines main primitives used in MACI. Read this if you want to learn about objects and trees used in MACI, key mathematical concepts, encryption algorithms, etc.

### Circuits, CLI commands, smart contracts

- In the [circuits](./circuits.md) document you will find the definition and description of all zk-SNARK circuits used in MACI.
- [CLI](./cli.md) document defines the console commands triggered by the users and the coordinator in the MACI process.
- [Contracts](./contracts.md) document describes the smart contracts used in MACI along with their functions.

### El Gamal Encryption (User-anonymity)

The following set of documents describe how the user-anonymity in MACI is obtained.

- [El Gamal General](./elgamal-general.md) describes the anonymity problem in MACI and provides a general overview of the solution relying on the El Gamal encryption.
- [El Gamal Flow](./elgamal-flow.md) document guides you through the user-process in MACI while focusing on the part of the protocol that takes care of the user anonymity (key deactivation/key activation, El Gamal encryption, rerandomization, nullifiers.).
- [El Gamal API](./elgamal-api.md) is an API definition of the CLI commands and smart contract functions related to the user-anonymity aspect of the protocol.


<!-- Should integrating-maci, trustedsetup, and audit documents also be included? -->