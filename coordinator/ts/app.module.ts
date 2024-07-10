import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { CryptoModule } from "./crypto/crypto.module";
import { EventsModule } from "./events/events.module";
import { FileModule } from "./file/file.module";
import { ProofGeneratorService } from "./proof/proof.service";

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
  ],
  controllers: [AppController],
  providers: [ProofGeneratorService],
})
export class AppModule {}
