import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";

import { HealthModule } from "./health/health.module.js";
import { IpfsModule } from "./ipfs/ipfs.module.js";
import { MessageModule } from "./message/message.module.js";
import { MessageBatchModule } from "./messageBatch/messageBatch.module.js";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.TTL),
        limit: Number(process.env.LIMIT),
      },
    ]),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: async () => {
        if (process.env.NODE_ENV === "test") {
          const { getTestMongooseModuleOptions } = await import("./jest/mongo.js");

          return getTestMongooseModuleOptions();
        }

        return {
          uri: process.env.MONGO_DB_URI,
          auth: {
            username: process.env.MONGODB_USER,
            password: process.env.MONGODB_PASSWORD,
          },
          dbName: process.env.MONGODB_DATABASE,
        };
      },
    }),
    IpfsModule,
    MessageModule,
    MessageBatchModule,
    HealthModule,
  ],
})
export class AppModule {}
