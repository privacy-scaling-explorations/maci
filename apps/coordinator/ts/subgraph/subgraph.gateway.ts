import { Logger, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";

import type { Server } from "socket.io";

import { AccountSignatureGuard } from "../auth/AccountSignatureGuard.service";

import { DeploySubgraphDto } from "./dto";
import { SubgraphService } from "./subgraph.service";
import { ESubgraphEvents, type IProgressArgs } from "./types";

/**
 * SubgraphGateway is responsible for websockets integration between client and SubgraphService.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.COORDINATOR_ALLOWED_ORIGINS?.split(","),
  },
})
@UseGuards(AccountSignatureGuard)
export class SubgraphGateway {
  /**
   * Logger
   */
  private readonly logger = new Logger(SubgraphGateway.name);

  /**
   * Websocket server
   */
  @WebSocketServer()
  server!: Server;

  /**
   * Initialize SubgraphGateway
   *
   * @param subgraphService - subgraph service
   */
  constructor(private readonly subgraphService: SubgraphService) {}

  /**
   * Generate proofs api method.
   * Events:
   * 1. ESubgraphEvents.START - trigger method call
   * 2. ESubgraphEvents.PROGRESS - returns deployed steps info
   * 3. ESubgraphEvents.FINISH - returns result of deploy operation
   * 4. ESubgraphEvents.ERROR - triggered when exception is thrown
   *
   * @param args - generate proof dto
   */
  @SubscribeMessage(ESubgraphEvents.START)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory(validationErrors) {
        return new WsException(validationErrors);
      },
    }),
  )
  async deploy(
    @MessageBody()
    data: DeploySubgraphDto,
  ): Promise<void> {
    await this.subgraphService.deploy(data, {
      onProgress: (result: IProgressArgs) => {
        this.server.emit(ESubgraphEvents.PROGRESS, result);
      },
      onSuccess: (url: string) => {
        this.server.emit(ESubgraphEvents.FINISH, { url });
      },
      onFail: (error: Error) => {
        this.logger.error(`Error:`, error);
        this.server.emit(ESubgraphEvents.ERROR, { message: error.message });
      },
    });
  }
}
