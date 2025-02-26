/**
 * IPFS Service - A service for interacting with IPFS.
 * This service allows reading data from IPFS using a Content Identifier (CID).
 * It is designed as a singleton to ensure a single instance is used throughout the application.
 */
export class IpfsService {
  /**
   * Singleton instance of the IpfsService.
   */
  private static INSTANCE?: IpfsService;

  /**
   * URL of the IPFS gateway to fetch data from.
   * Defaults to 'https://ipfs.io/ipfs' if not provided in the environment variables.
   */
  private ipfsGatewayUrl: string;

  /**
   * Retrieves the singleton instance of the IpfsService.
   * If the instance does not exist, a new one is created and returned.
   *
   * @returns {IpfsService} The singleton instance of the IpfsService.
   */
  static getInstance(): IpfsService {
    if (!IpfsService.INSTANCE) {
      IpfsService.INSTANCE = new IpfsService();
    }

    return IpfsService.INSTANCE;
  }

  /**
   * Private constructor to initialize the service.
   * Should not be called directly.
   * Use `getInstance()` to access the service.
   */
  private constructor() {
    // Initialize the IPFS gateway URL, using an environment variable or a default value.
    this.ipfsGatewayUrl = process.env.IPFS_GATEWAY_URL || "https://ipfs.io/ipfs";
  }

  /**
   * Fetches data from IPFS using the provided Content Identifier (CID).
   * The data is expected to be returned in JSON format, and is parsed accordingly.
   *
   * @param cid - The Content Identifier (CID) of the IPFS object to retrieve.
   * @returns {Promise<T>} A promise that resolves with the fetched data, parsed as the specified type `T`.
   * @throws {Error} If the request fails or if the data cannot be parsed as JSON.
   *
   * @template T - The type of the data expected from the IPFS response.
   */
  async read<T>(cid: string): Promise<T | null> {
    return fetch(`${this.ipfsGatewayUrl}/${cid}`)
      .then((res) => res.json().catch(() => null))
      .then((res) => res as T)
      .catch(() => null);
  }
}
