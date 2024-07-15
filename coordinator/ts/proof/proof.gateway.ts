import { Logger, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { IGenerateProofsBatchData, type Proof, type TallyData } from "maci-contracts";

import type { Server } from "socket.io";

import { AccountSignatureGuard } from "../auth/AccountSignatureGuard.service";

import { GenerateProofDto } from "./dto";
import { ProofGeneratorService } from "./proof.service";
import { EProofGenerationEvents } from "./types";

/**
 * ProofGateway is responsible for websockets integration between client and ProofGeneratorService.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.COORDINATOR_ALLOWED_ORIGINS?.split(","),
  },
})
@UseGuards(AccountSignatureGuard)
export class ProofGateway {
  /**
   * Logger
   */
  private readonly logger = new Logger(ProofGateway.name);

  /**
   * Websocket server
   */
  @WebSocketServer()
  server!: Server;

  /**
   * Initialize ProofGateway
   *
   * @param proofGeneratorService - proof generator service
   */
  constructor(private readonly proofGeneratorService: ProofGeneratorService) {}

  /**
   * Generate proofs api method.
   * Events:
   * 1. EProofGenerationEvents.START - trigger method call
   * 2. EProofGenerationEvents.PROGRESS - returns generated proofs with batch info
   * 3. EProofGenerationEvents.FINISH - returns generated proofs and tally data when available
   * 4. EProofGenerationEvents.ERROR - triggered when exception is thrown
   *
   * @param args - generate proof dto
   */
  @SubscribeMessage(EProofGenerationEvents.START)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory(validationErrors) {
        return new WsException(validationErrors);
      },
    }),
  )
  async generate(
    @MessageBody()
    data: GenerateProofDto,
  ): Promise<void> {
    await this.proofGeneratorService.generate(data, {
      onBatchComplete: (result: IGenerateProofsBatchData) => {
        this.server.emit(EProofGenerationEvents.PROGRESS, result);
      },
      onComplete: (proofs: Proof[], tallyData?: TallyData) => {
        this.server.emit(EProofGenerationEvents.FINISH, { proofs, tallyData });
      },
      onFail: (error: Error) => {
        this.logger.error(`Error:`, error);
        this.server.emit(EProofGenerationEvents.ERROR, { message: error.message });
      },
    });
  }
}
