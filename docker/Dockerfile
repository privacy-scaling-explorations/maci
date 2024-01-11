FROM ubuntu:20.04 as maci-node

ARG COMMIT_SHA=unknown
ARG REPO_NAME="https://github.com/privacy-scaling-explorations/maci.git"
ARG BRANCH_NAME=v1

# install dependency
RUN apt-get update \
    && apt-get install -y curl wget git jq\
    && apt-get install -y build-essential libgmp-dev libsodium-dev nasm \ 
    && apt-get install -y libgmp-dev nlohmann-json3-dev nasm g++ 
    

# install nvm and Node.js
ENV NODE_VERSION=14.18.1
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm install-latest-npm
RUN npm i -g pnpm
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"

# add metadata
RUN echo "REPO_NAME='$REPO_NAME'" > /etc/image-info \
    && echo "BRANCH_NAME='$BRANCH_NAME'" >> /etc/image-info \
    && echo "NODE_VERSION='$(node --version)'" >> /etc/image-info 


# install rapicsnark for v1.0.0
RUN cd ~ \
    && git clone https://github.com/iden3/rapidsnark.git \
    && cd rapidsnark \
    && git checkout 1c13721de4a316b0b254c310ccec9341f5e2208e \
    && pnpm install \
    && git submodule init \
    && git submodule update \
    && pnpm exec task createFieldSources \
    && pnpm exec task buildProver

# install maci 
RUN cd ~ \
    && git clone $REPO_NAME \
    && cd maci \
    && git checkout ${BRANCH_NAME} \
    && pnpm i 
RUN cd ~/maci && pnpm run build

# HTTP port
EXPOSE 8080
EXPOSE 8545

