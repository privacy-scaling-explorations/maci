import { PublicKey } from "@maci-protocol/domainobjs";

import type { GraphQLResponse } from "./types";

/**
 * A class that can be used to interact with MACI's subgraph
 * @dev refer to apps/subgraph for subgraph deployment and configuration
 */
export class MaciSubgraph {
  /**
   * The URL of the subgraph
   */
  private url: string;

  /**
   * The query to get all MACIs public keys signed up
   */
  private userQuery = `
        query {
            users {
                id
            }
        }
    `;

  /**
   * Create a new instance of the MaciSubgraph class
   *
   * @param url - The URL of the subgraph
   */
  constructor(url: string) {
    this.url = url;
  }

  /**
   * Get the public keys of all MACIs signed up
   *
   * @returns Array of public keys
   */
  async getKeys(): Promise<PublicKey[]> {
    const res = await fetch(this.url, {
      method: "POST",
      body: JSON.stringify({
        query: this.userQuery,
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`GraphQL query failed: ${res.statusText}`);
    }

    const json = (await res.json()) as GraphQLResponse;

    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    if (!json.data?.users) {
      throw new Error("No users data in response");
    }

    return json.data.users.map((user) => {
      // Split the id into x and y coordinates and convert to BigInt
      const [x, y] = user.id.split(" ");
      return new PublicKey([BigInt(x), BigInt(y)]);
    });
  }
}
