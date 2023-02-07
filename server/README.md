[![NPM Package][server-npm-badge]][server-npm-link]

## Local Development

### Setup

Follow [instruction](https://privacy-scaling-explorations.github.io/maci/) to setup environment and dependency, then

```bash
docker build -t maci-node:v0.5 - < LightDockerfile
cd docker
./setup.sh
```

### Development

```bash
### Setup
# docker/docker-compose.yml: manually replace ETH_PROVIDER from 127.0.0.1 to docker network ip
# server/docker.sh: manually replace SCRIPT location to local maci repo location

### In one terminal
# for v1.0
cd contracts && npm run hardhat
# for v0.10
cd contracts && npm run ganache

### In second terminal
cd server && ./docker.sh -u
# whenever modified the code, just restart the docker instance to take effect
cd server && ./docker.sh -ud

### In third terminal
# for v1.0
cd server && ./test.sh
# for v0.10
cd server && ./test_v0_10.sh

### turnoff docker after finish
cd server && ./docker.sh -d

```

## Simulate Production Environment

In real production, we will replace the hardhat local testnet by real ethereum compatible network

### Setup zkeys

```bash
#### setup zkeys if you haven't done it before
cd server && ./docker.sh -u # then Ctrl-C
# login into docker
./docker.sh -l
# now gen_zkey inside docker if you haven't setup zkeys
cd ~/maci/cli && ./gen_zkey.sh
```

### Development

```bash
### In one terminal
cd server && ./docker.sh -u

## In second terminal
cd server && ./docker.sh -l
# now in docker
# for v1.0
cd ~/maci/contracts && npm run hardhat
# for v0.10
cd ~/maci_v0_10/contracts && npm run ganache

### In third terminal, admin role
cd server && ./docker.sh -l
# now in docker
cd ~/maci/server
# run any commands for admin, e.g.
# v1.0
./admin.sh deploy
./admin.sh store 
# v0.10
./admin_v0_10.sh deploy
./admin_v0_10.sh store

### In fourth terminal, user role
cd server 
# run any commands for user, e.g.
# v1.0
./user.sh signup -p $pk -x $maci
# v0.10
./user_v0_10.sh signup -p $pk -x $maci
```

[server-npm-badge]: https://img.shields.io/npm/v/maci-server.svg
[server-npm-link]: https://www.npmjs.com/package/maci-server
