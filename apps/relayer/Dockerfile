# Copy source code and build the project
FROM node:24-alpine AS builder

WORKDIR /builder

COPY . .

RUN npm i -g pnpm@10
RUN pnpm install
RUN pnpm run build

# Create image by copying build artifacts
FROM node:24-alpine AS runner
RUN npm i -g pnpm@10

USER node
ARG PORT=3000

WORKDIR /maci
COPY --chown=node:node  --from=builder /builder/ ./
RUN pnpm run download-zkeys:test
WORKDIR /maci/apps/relayer

EXPOSE ${PORT}
CMD ["sh", "-c", "pnpm run hardhat & node build/ts/main.js"]
