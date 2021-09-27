FROM node:16-bullseye AS builder

WORKDIR /maci
COPY . /maci/

RUN npm i && \
    npm run bootstrap && \
    npm run build

FROM builder AS circuits
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /maci/circuits
COPY --from=builder /maci/circuits ./

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update -qq --fix-missing && \
    apt-get install -qq -y curl build-essential libssl-dev libgmp-dev \
        libsodium-dev nlohmann-json3-dev git nasm libgcc-s1 dialog apt-utils

RUN wget http://launchpadlibrarian.net/531361873/libc6_2.33-0ubuntu5_amd64.deb && \
dpkg --auto-deconfigure -i libc6_2.33-0ubuntu5_amd64.deb || true
RUN strings /usr/lib/x86_64-linux-gnu/libstdc++.so.6 | grep GLIBCXX
# Install zkutil
# RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
#RUN ~/.cargo/bin/cargo install zkutil

# RUN echo "deb http://ftp.us.debian.org/debian sid main" >> /etc/apt/sources.list
# RUN apt-get -t unstable install libgcc-s1

#RUN ./scripts/runTestsInCi.sh

