# Copy source code and build the project
FROM node:20-alpine AS builder

WORKDIR /builder

# This copies all the monorepo
 COPY ../../ .


# Copy coordinator app files
# It is supposed to be faster but @maci-protocol packages versions are not working
# COPY apps/coordinator .

RUN npm i -g pnpm@9
RUN pnpm install
RUN pnpm run build


# Create image by copying build artifacts
FROM node:20-alpine AS runner
RUN npm i -g pnpm@9

USER node

# monorepo root directory
WORKDIR /maci
COPY --chown=node:node  --from=builder /builder/ ./

RUN pnpm run download-zkeys:test:coordinator

RUN mkdir -p ~/rapidsnark/build; \
    wget -qO ~/rapidsnark/build/prover https://maci-devops-zkeys.s3.ap-northeast-2.amazonaws.com/rapidsnark-linux-amd64-1c137; \
    chmod +x ~/rapidsnark/build/prover

# coordinator directory
WORKDIR /maci/apps/coordinator
RUN pnpm run generate-keypair
ENV NODE_OPTIONS="--max-old-space-size=8192"


CMD ["pnpm","start:prod"]

