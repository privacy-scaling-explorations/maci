# MACI Relayer Service

This repository contains the setup and instructions to run the MACI Relayer service along with MongoDB using Docker.

For more details on how to use and integrate the offchain relayer service into your application, please refer to this [guide](/docs/category/offchain-relayer).

## Flow Diagram

Below is a high-level diagram illustrating the flow of the Relayer Service:

![MACI Relayer Flow](./relayer-diagram.png)

## High-Level Overview of the Relayer:

### Functionality

The Relayer serves as an intermediary between users and the MACI system. It performs the following tasks:

- Allows users to send messages without having to pay gas fees by processing these messages off-chain.
- Receives user messages.
- Prepare messages batches and upload it to IPFS
- Submits the message hashes to the Poll contract with IPFS hash of the batch.

This process ensures that user actions are recorded on-chain without compromising their privacy.

### Privacy Preservation

By verifying the zero-knowledge proofs, the Relayer ensures that only authorized users can send messages.
Users must know the pre-image to a state leaf in the poll state tree.

### Decentralization and Trust

It's recommended that the coordinator only runs this service for now. That is because if the service malfunctions and batch hashes are pushed on chain without the messages actually being stored on ipfs, then polls can't be finalized.

### Integration with MACI Components

The Relayer interacts with other components of the MACI system, such as the **Coordinator** and the on-chain smart contracts:

- The **Coordinator** fetches all the messages stored in IPFS and uses them as regular on-chain messages.
- This ensures that user messages are properly processed and recorded, contributing to the overall functionality and security of the voting protocol.

## Prerequisites

Make sure you have the following tools installed on your system:

- **Docker**: [Install Docker](https://www.docker.com/products/docker-desktop)
- **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

Follow these steps to run the MACI Relayer service using Docker.

### 1. Clone the Repository

First, clone the repository to your local machine.

```bash
git clone https://github.com/privacy-scaling-explorations/maci
cd maci
```

## 2. Configure Environment Variables

The `.env` file contains sensitive configuration values that will be injected into the Docker containers at runtime. To set them up:

1. Copy the `.env.example` file to `.env`.

```bash
cp .env.example .env
```

2. Edit the `.env` file and configure the variables.

## 3. Build and Run the Docker Containers

Now that your environment is set up, it's time to build and run the Docker containers.

Run the following command from the root directory of your project:

```bash
docker-compose up --build
```

This command does the following:

- Builds the Docker images based on the Dockerfile and `docker-compose.yml` files.
- Starts the service container (the MACI relayer application) and the mongodb container.

The MACI Relayer service will be available on port 3000 by default (you can modify this in the `.env` file).

## 4. Access the Service

Once the containers are up and running, you can access the relayer service at:

```
http://localhost:3000
```

Additionally, the Swagger UI documentation for the Relayer service API can be accessed at:

```
http://localhost:3000/api
```

You can interact with the API through the Swagger interface, which provides a convenient way to test endpoints and view the API methods.

## 5. Check Logs

To view the logs from the containers and troubleshoot any issues, run:

```bash
docker-compose logs
```

This will display logs from both the service (relayer) and mongodb containers.

## 6. Stop the Services

To stop the containers and remove the containers (but keep the volumes), use the following command:

```bash
docker-compose down
```

This will stop and remove the containers but retain the volumes (like MongoDB data). To also remove the volumes, run:

```bash
docker-compose down --volumes
```

## 7. MongoDB Persistence

MongoDB data is persisted using Docker volumes (`mongodb-data`). Even if you remove and recreate the MongoDB container, the data will persist.

This ensures that any data stored in the MongoDB database is not lost even if the container is restarted or removed.

If you'd like to remove the persisted data as well, you can remove the volume by running:

```bash
docker volume rm your-repo_mongodb-data
```

This will delete the volume, along with all the data stored in MongoDB.

## Additional Information

For more details, you can read the following post on EthResearch:

[MACI with Mostly Off-Chain Happy Path](https://ethresear.ch/t/maci-with-mostly-off-chain-happy-path/19527)
