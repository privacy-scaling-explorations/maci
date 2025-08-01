import { Injectable, OnModuleInit } from "@nestjs/common";
import { createClient, RedisClientType } from "@redis/client";

import type { IGetAllSingleObject } from "./types";

/**
 * Redis service to interact with the Redis database.
 */
@Injectable()
export class RedisService implements OnModuleInit {
  /**
   * Client instance used to interact with the Redis database.
   */
  private client: RedisClientType;

  /**
   * Create a new instance of the RedisService.
   * The Redis configuration is set up here
   */
  constructor() {
    this.client = createClient({
      url: `redis://${process.env.COORDINATOR_REDIS_HOST}:${process.env.COORDINATOR_REDIS_PORT}`,
      disableOfflineQueue: true,
    });
  }

  /**
   * Initializes the Redis client connection when the module has been uploaded.
   * @dev it is a lifecycle hook provided by NestJS that is called after all dependencies
   * are injected and the module is fully initialized.
   * This ensures your service is ready and all dependencies are available.
   */
  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  /**
   * Saves a new key-value pair in Redis.
   * @param key key for the Redis entry
   * @param value value to be stored in Redis
   */
  async set(key: string, value: string): Promise<void> {
    // we are not using @redis/json because we dont need complex search capabilities
    // we store a string (lightweight) and parse it to use the object
    await this.client.set(key, value);
  }

  /**
   * Retrieves a value from Redis by its key.
   * @param key key for the Redis entry
   * @returns the value stored as string in Redis or null if the key does not exist
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Retrieves all keys from Redis that match a specific pattern.
   * @param match optional pattern to match keys in Redis
   * @dev if no match is provided, it will return all keys
   * @returns the array of string values stored in Redis that match the pattern
   */
  async getAll(match?: string): Promise<IGetAllSingleObject[]> {
    let result: IGetAllSingleObject[] = [];
    let currentCursor = "0";

    do {
      // using a cursor is recommended to be use in production environment
      // eslint-disable-next-line no-await-in-loop
      const { cursor, keys } = await this.client.scan(currentCursor, { MATCH: match || "*", COUNT: 100 });

      // eslint-disable-next-line no-await-in-loop
      const values = await Promise.all(keys.map((key) => this.get(key)));

      result = result.concat(
        values
          .map((value, index) => ({ key: keys[index], value }))
          .filter((item): item is IGetAllSingleObject => item.value !== null),
      );

      currentCursor = cursor;
    } while (currentCursor !== "0");

    return result;
  }

  /**
   * Deletes a key from Redis.
   * @param key key to be deleted from Redis
   */
  async delete(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * Check if the connection to Redis is open
   * @return true if the connection is open, false otherwise
   */
  isOpen(): boolean {
    return this.client.isOpen;
  }
}
