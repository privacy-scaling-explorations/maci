import type { MongooseModuleOptions } from "@nestjs/mongoose";

/**
 * Get test mongoose module options
 *
 * @param options mongoose module options
 * @returns mongoose module options for testing
 */
export const getTestMongooseModuleOptions = async (
  options: MongooseModuleOptions = {},
): Promise<MongooseModuleOptions> => {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mongod = await MongoMemoryServer.create();

  return {
    uri: mongod.getUri(),
    ...options,
  };
};
