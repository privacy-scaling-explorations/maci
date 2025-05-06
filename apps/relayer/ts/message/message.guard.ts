import { MACI__factory as MACIFactory, Poll__factory as PollFactory } from "@maci-protocol/sdk";
import {
  Logger,
  type CanActivate,
  Injectable,
  SetMetadata,
  type ExecutionContext,
  type CustomDecorator,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { validate } from "class-validator";
import hardhat from "hardhat";
import flatMap from "lodash/flatMap.js";
import flatten from "lodash/flatten.js";
import map from "lodash/map.js";
import values from "lodash/values.js";

import type { Request as Req } from "express";

import { MAX_MESSAGES, MessageContractParamsDto, PublishMessagesDto } from "./message.dto.js";

/**
 * Public metadata key
 */
export const PUBLIC_METADATA_KEY = "isPublic";

/**
 * Public decorator to by-pass auth checks
 *
 * @returns public decorator
 */
export const Public = (): CustomDecorator => SetMetadata(PUBLIC_METADATA_KEY, true);

@Injectable()
export class MessageGuard implements CanActivate {
  /**
   * Logger
   */
  private readonly logger: Logger;

  /**
   * Initialized MessageGuard
   *
   * @param reflector Reflector
   */
  constructor(private readonly reflector: Reflector) {
    this.logger = new Logger(MessageGuard.name);
  }

  /**
   * This function should return a boolean, indicating  whether the request is allowed or not based on proof.
   *
   * @param ctx - execution context
   * @returns whether the request is allowed or not
   */
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(PUBLIC_METADATA_KEY, ctx.getHandler());

    if (isPublic) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<Partial<Req<unknown, unknown, PublishMessagesDto>>>();

    const messages =
      Array.isArray(request.body?.messages) && request.body.messages.length <= MAX_MESSAGES
        ? request.body.messages
        : [];

    const messageErrors = await Promise.all(
      map(messages, (message) => validate(Object.assign(new MessageContractParamsDto(), message))),
    ).then((errors) => flatten(errors));

    const dto = Object.assign(new PublishMessagesDto(), request.body);
    const dtoErrors = await validate(dto, { forbidUnknownValues: false });

    if (dtoErrors.length > 0 || messageErrors.length > 0) {
      this.logger.warn("Invalid body: ", dtoErrors);
      throw new HttpException(
        {
          error: "Bad Request",
          message: flatMap(dtoErrors, (error) => values(error.constraints)).concat(
            flatMap(messageErrors, ({ constraints }) =>
              values(constraints).map((value, index) => `messages.${index}.${value}`),
            ),
          ),
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const [signer] = await hardhat.ethers.getSigners();
      const maciContract = MACIFactory.connect(dto.maciContractAddress, signer);
      const pollAddresses = await maciContract.polls(dto.poll);
      const pollContract = PollFactory.connect(pollAddresses.poll, signer);

      const isValid = await pollContract.verifyJoinedPollProof(dto.stateLeafIndex, dto.proof);

      return isValid;
    } catch (error) {
      this.logger.error("Activate error: ", error);
      return false;
    }
  }
}
