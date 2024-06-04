import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEthereumAddress, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

/**
 * Data transfer object for generate proof
 */
export class GenerateProofDto {
  /**
   * Poll id
   */
  @ApiProperty({
    description: "Poll id",
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  poll!: number;

  /**
   * Maci contract address
   */
  @ApiProperty({
    description: "MACI contract address",
    type: String,
  })
  @IsEthereumAddress()
  maciContractAddress!: string;

  /**
   * Tally contract address
   */
  @ApiProperty({
    description: "Tally contract address",
    type: String,
  })
  @IsEthereumAddress()
  tallyContractAddress!: string;

  /**
   * Whether to use Qv or NonQv
   */
  @ApiProperty({
    description: "Whether to use quadratic voting or not",
    type: Boolean,
  })
  @IsBoolean()
  useQuadraticVoting!: boolean;

  /**
   * Encrypted coordinator private key with RSA public key (see .env.example)
   */
  @ApiProperty({
    description: "Encrypted coordinator private key with RSA public key (see README.md)",
    minimum: 1,
    maximum: 1024,
    type: String,
  })
  @IsString()
  @Length(1, 1024)
  encryptedCoordinatorPrivateKey!: string;

  /**
   * Start block for event processing
   */
  @ApiProperty({
    description: "Start block for event parsing",
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  startBlock?: number;

  /**
   * End block for event processing
   */
  @ApiProperty({
    description: "End block for event parsing",
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  endBlock?: number;

  /**
   * Blocks per batch for event processing
   */
  @ApiProperty({
    description: "Blocks per batch for event parsing",
    minimum: 1,
    maximum: 1000,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  blocksPerBatch?: number;
}
