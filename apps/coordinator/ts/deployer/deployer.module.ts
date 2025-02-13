import { Module } from "@nestjs/common";

import { CryptoModule } from "../crypto/crypto.module";
import { FileModule } from "../file/file.module";
import { SessionKeysModule } from "../sessionKeys/sessionKeys.module";

import { DeployerController } from "./deployer.controller";
import { DeployerService } from "./deployer.service";

@Module({
  imports: [FileModule, CryptoModule, SessionKeysModule],
  controllers: [DeployerController],
  providers: [DeployerService],
})
export class DeployerModule {}
