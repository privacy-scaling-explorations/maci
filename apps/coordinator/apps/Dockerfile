# Copy source code and build the project
FROM node:20-alpine as builder

WORKDIR /builder

COPY . .

RUN npm i -g pnpm@9
RUN pnpm install --frozen-lockfile --prefer-offline
RUN pnpm run build

# Create image by copying build artifacts
FROM node:20-alpine as runner
RUN npm i -g pnpm@9

RUN mkdir -p ~/rapidsnark/build; \
    wget -qO ~/rapidsnark/build/prover https://maci-devops-zkeys.s3.ap-northeast-2.amazonaws.com/rapidsnark-linux-amd64-1c137; \
    chmod +x ~/rapidsnark/build/prover
RUN wget -qO ~/circom https://github.com/iden3/circom/releases/download/v2.1.6/circom-linux-amd64; \
    chmod +x ~/circom; \
    mv ~/circom /bin

USER node
ARG PORT=3000

WORKDIR ./maci
COPY --chown=node:node  --from=builder /builder/ ./
RUN pnpm run download-zkeys-coordinator:test
WORKDIR /maci/coordinator
RUN pnpm run generate-keypair

EXPOSE ${PORT}
CMD ["node", "build/ts/main.js"]
