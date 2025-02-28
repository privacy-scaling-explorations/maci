import { Module } from "@nestjs/common";

import { CryptoModule } from "../crypto/crypto.module";
import { FileModule } from "../file/file.module";
import { SessionKeysModule } from "../sessionKeys/sessionKeys.module";

import { ProofController } from "./proof.controller";
import { ProofGateway } from "./proof.gateway";
import { ProofGeneratorService } from "./proof.service";

@Module({
  imports: [FileModule, CryptoModule, SessionKeysModule],
  controllers: [ProofController],
  providers: [ProofGeneratorService, ProofGateway],
})
export class ProofModule {}
