import { Module } from "@nestjs/common";

import { CryptoModule } from "../crypto/crypto.module";
import { FileModule } from "../file/file.module";
import { ProofGeneratorService } from "../proof/proof.service";

import { EventsGateway } from "./events.gateway";

@Module({
  imports: [FileModule, CryptoModule],
  providers: [EventsGateway, ProofGeneratorService],
})
export class EventsModule {}
