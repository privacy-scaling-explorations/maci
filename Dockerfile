FROM node:15.8.0-buster

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update -qq --fix-missing && \
    apt-get install -qq -y curl build-essential libssl-dev libgmp-dev \
                       libsodium-dev nlohmann-json3-dev git nasm

# Install zkutil
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
RUN ~/.cargo/bin/cargo install zkutil

WORKDIR /maci
COPY . /maci/
RUN npm i && \
    npm run bootstrap && \
    npm run build

CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
