## Local Development

### Setup

Follow [instruction](https://appliedzkp.github.io/maci/) to setup environment and dependency, then

```bash
# build docker image
docker build -t maci-node:v1 - < Dockerfile

# replace the host.docker.internal by docker network ip
cd docker
./setup.sh
# Also manually replace 127.0.0.1 in hardhat_uri by docker network ip

# modify the source location of dev-maci in docker-compose.yml if necessary

```

### Development

The following happens in local machine, not in docker

```bash
### In one terminal
cd contracts && npm run hardhat

### In second terminal
cd server && ./docker.sh -u
# whenever modified the code, just restart the docker instance to take effect
cd server && ./docker.sh -ud

### In third terminal
cd server && ./test.sh

### turnoff docker after finish
cd server && ./docker.sh -d

```

## Simulate Production Environment

In real production, we will replace the hardhat local testnet by real ethereum compatible network

### Setup

```bash
### replace host.docker.internal by docker network ip
cd docker && ./setup.sh
# Unlike local developemnt, keep hardhat_uri in this case

#### setup zkeys
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
cd ~/maci/contracts && npm run hardhat

### In third terminal, admin role
cd server && ./docker.sh -l
# now in docker
cd ~/maci/server
# run any commands for admin, e.g.
./admin.sh deploy
./admin.sh store 

### In fourth terminal, user role
cd server 
# run any commands for user, e.g.
./user.sh signup -p $pk -x $mac
```
