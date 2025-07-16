import { ESupportedChains } from "@maci-protocol/sdk";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsEthereumAddress, IsInt, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";

/**
 * Data transfer object for deploying subgraph
 */
export class DeploySubgraphDto {
  /**
   * MACI contract address
   */
  @ApiProperty({
    description: "MACI contract address",
    type: String,
  })
  @IsEthereumAddress()
  maciContractAddress!: string;

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
  startBlock!: number;

  /**
   * Network CLI name
   */
  @ApiProperty({
    description: "Network CLI name (https://thegraph.com/docs/en/developing/supported-networks/)",
    enum: ESupportedChains,
  })
  @IsEnum(ESupportedChains)
  network!: ESupportedChains;

  /**
   * Subgraph name
   */
  @ApiProperty({
    description: "Subgraph name",
    type: String,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string;

  /**
   * Version tag (ex: v0.0.1)
   */
  @ApiProperty({
    description: "Version tag (ex: v0.0.1)",
    type: String,
  })
  @IsString()
  @Matches(/^v\d+\.\d+\.\d+$/)
  tag!: string;
}
