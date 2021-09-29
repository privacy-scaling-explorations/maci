FROM node:16-bullseye AS builder

WORKDIR /maci
COPY . /maci/

RUN npm i && \
    npm run bootstrap && \
    npm run build

# Build circuits
FROM builder AS circuits
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /maci/circuits
COPY --from=builder /maci/circuits ./

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get update -qq --fix-missing && \
    apt-get install -qq -y curl build-essential libssl-dev libgmp-dev \
        libsodium-dev nlohmann-json3-dev git nasm libgcc-s1

# Install updated glibc dependencies
RUN wget http://launchpadlibrarian.net/531361873/libc6_2.33-0ubuntu5_amd64.deb && \
dpkg --auto-deconfigure -i libc6_2.33-0ubuntu5_amd64.deb || true
RUN wget http://ftp.debian.org/debian/pool/main/g/gcc-11/gcc-11-base_11.2.0-8_amd64.deb && \
dpkg --auto-deconfigure -i gcc-11-base_11.2.0-8_amd64.deb || true
RUN wget http://ftp.debian.org/debian/pool/main/g/gcc-11/libstdc++6_11.2.0-8_amd64.deb && \
dpkg --auto-deconfigure -i libstdc++6_11.2.0-8_amd64.deb || true

# Install zkutil
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
RUN ~/.cargo/bin/cargo install zkutil

RUN ./scripts/runTestsInCi.sh

# TODO: Build integration tests
# FROM builder AS integration

# TODO: Build contracts
# FROM builder AS contracts

