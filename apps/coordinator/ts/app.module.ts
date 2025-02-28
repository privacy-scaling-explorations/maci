import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { CryptoModule } from "./crypto/crypto.module";
import { DeployerModule } from "./deployer/deployer.module";
import { FileModule } from "./file/file.module";
import { ProofModule } from "./proof/proof.module";
import { SessionKeysModule } from "./sessionKeys/sessionKeys.module";
import { SubgraphModule } from "./subgraph/subgraph.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.TTL),
        limit: Number(process.env.LIMIT),
      },
    ]),
    FileModule,
    CryptoModule,
    SubgraphModule,
    ProofModule,
    SessionKeysModule,
    DeployerModule,
  ],
})
export class AppModule {}
