# Copy source code and build the project
FROM node:24-alpine AS builder
RUN npm i -g pnpm@10

WORKDIR /builder

# Copy the entire monorepo to maintain workspace structure
COPY . .

RUN pnpm install
RUN pnpm run build

WORKDIR /builder/apps/coordinator

# Create image by copying build artifacts
FROM node:24-slim AS runner
RUN npm i -g pnpm@10

RUN apt-get update && apt-get install -y \
    wget \
    libgmp10 \
    libsodium23 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/node/rapidsnark/build; \
    wget -qO /home/node/rapidsnark/build/prover https://maci-devops-zkeys.s3.ap-northeast-2.amazonaws.com/rapidsnark-linux-amd64-1c137; \
    chmod +x /home/node/rapidsnark/build/prover

USER node
WORKDIR /maci
COPY --chown=node:node --from=builder /builder/ ./

RUN pnpm run download-zkeys:test

# coordinator directory
WORKDIR /maci/apps/coordinator
RUN pnpm run generate-keypair
ENV NODE_OPTIONS="--max-old-space-size=8192"

CMD ["pnpm","start:prod"]
