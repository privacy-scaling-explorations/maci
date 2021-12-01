## Local Development

### Setup

Follow [instruction](https://appliedzkp.github.io/maci/) to setup environment and dependency, then

```bash
# build docker image
docker build -t maci-node:v1 - < Dockerfile

# replace the host.docker.internal by docker network ip
cd docker
./setup.sh

# modify volumes location (i.e. location of maci repo) in docker-compose.yml  if necessary

```

### Development
```bash
# In one terminal
cd contracts && npm run hardhat

# In second terminal
cd server && ./docker.sh -u

# In third terminal
cd server && ./test.sh

# turnoff docker after finish
cd server && ./docker.sh -d
```
