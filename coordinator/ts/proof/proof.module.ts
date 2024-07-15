import { Module } from "@nestjs/common";

import { CryptoModule } from "../crypto/crypto.module";
import { FileModule } from "../file/file.module";

import { ProofController } from "./proof.controller";
import { ProofGeneratorService } from "./proof.service";

@Module({
  imports: [FileModule, CryptoModule],
  controllers: [ProofController],
  providers: [ProofGeneratorService],
})
export class ProofModule {}
