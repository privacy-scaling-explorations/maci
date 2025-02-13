import { Module } from "@nestjs/common";

import { CryptoService } from "../crypto/crypto.service";
import { FileModule } from "../file/file.module";

import { SessionKeysController } from "./sessionKeys.controller";
import { SessionKeysService } from "./sessionKeys.service";

@Module({
  imports: [FileModule],
  controllers: [SessionKeysController],
  providers: [SessionKeysService, CryptoService],
  exports: [SessionKeysService],
})
export class SessionKeysModule {}
