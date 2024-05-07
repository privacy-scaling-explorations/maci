import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { ProofGeneratorService } from "./proof/proof.service";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.TTL),
        limit: Number(process.env.LIMIT),
      },
    ]),
  ],
  controllers: [AppController],
  providers: [ProofGeneratorService],
})
export class AppModule {}
