import { IsBoolean, IsEthereumAddress, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

/**
 * Data transfer object for generate proof
 */
export class GenerateProofDto {
  /**
   * Poll id
   */
  @IsInt()
  @Min(0)
  poll!: number;

  /**
   * Maci contract address
   */
  @IsEthereumAddress()
  maciContractAddress!: string;

  /**
   * Tally contract address
   */
  @IsEthereumAddress()
  tallyContractAddress!: string;

  /**
   * Whether to use Qv or NonQv
   */
  @IsBoolean()
  useQuadraticVoting!: boolean;

  /**
   * Encrypted coordinator private key with RSA public key (see .env.example)
   */
  @IsString()
  @Length(1, 1024)
  encryptedCoordinatorPrivateKey!: string;

  /**
   * Start block for event processing
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  startBlock?: number;

  /**
   * End block for event processing
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  endBlock?: number;

  /**
   * Blocks per batch for event processing
   */
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  blocksPerBatch?: number;
}
