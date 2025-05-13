/**
 * The response from the GraphQL query
 */
export interface GraphQLResponse {
  /**
   * The data from the query
   */
  data?: {
    users: {
      id: string;
    }[];
  };
  /**
   * The errors from the query
   */
  errors?: {
    message: string;
  }[];
}
