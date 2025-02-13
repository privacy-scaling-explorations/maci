import { Body, Controller, Delete, Get, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import type { IGenerateSessionKeyReturn } from "./types";

import { AccountSignatureGuard } from "../auth/AccountSignatureGuard.service";

import { DeactivateSessionKeyDto } from "./dto";
import { SessionKeysService } from "./sessionKeys.service";

@ApiTags("v1/session-keys")
@ApiBearerAuth()
@Controller("v1/session-keys")
@UseGuards(AccountSignatureGuard)
export class SessionKeysController {
  /**
   * Initialize SessionKeysController
   *
   * @param sessionKeysService - session keys service
   */
  constructor(private readonly sessionKeysService: SessionKeysService) {}

  /**
   * Generate a session key api method
   *
   * @returns generated session key address
   */
  @ApiResponse({ status: HttpStatus.OK, description: "The session key was successfully generated" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Get("generate")
  generateSessionKey(): IGenerateSessionKeyReturn {
    return this.sessionKeysService.generateSessionKey();
  }

  /**
   * Delete a session key api method
   *
   * @param args - delete session key dto
   * @returns deleted session key address
   */
  @ApiBody({ type: DeactivateSessionKeyDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The session key was successfully deactivated" })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "BadRequest" })
  @Delete("delete")
  deactivateSessionKey(@Body() args: DeactivateSessionKeyDto): void {
    this.sessionKeysService.deactivateSessionKey(args.sessionKeyAddress);
  }
}
