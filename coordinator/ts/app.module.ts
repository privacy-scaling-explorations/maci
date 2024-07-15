import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { CryptoModule } from "./crypto/crypto.module";
import { EventsModule } from "./events/events.module";
import { FileModule } from "./file/file.module";
import { ProofModule } from "./proof/proof.module";
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
    EventsModule,
    SubgraphModule,
    ProofModule,
  ],
})
export class AppModule {}
