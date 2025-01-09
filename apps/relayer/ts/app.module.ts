import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { MessageModule } from "./message/message.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.TTL),
        limit: Number(process.env.LIMIT),
      },
    ]),
    MessageModule,
  ],
})
export class AppModule {}
