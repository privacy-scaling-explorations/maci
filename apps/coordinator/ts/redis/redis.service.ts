import { Injectable } from "@nestjs/common";
import { createClient, RedisClientType } from "@redis/client";

@Injectable()
export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: `redis://${process.env.COORDINATOR_REDIS_HOST || "redis"}
:${process.env.COORDINATOR_REDIS_PORT || 6379}`,
      disableOfflineQueue: true,
    });
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async delete(key: string): Promise<number> {
    return this.client.del(key);
  }
}
