import { Module } from "@nestjs/common";

import { CryptoModule } from "../crypto/crypto.module";
import { FileModule } from "../file/file.module";

import { SubgraphController } from "./subgraph.controller";
import { SubgraphService } from "./subgraph.service";

@Module({
  imports: [FileModule, CryptoModule],
  controllers: [SubgraphController],
  providers: [SubgraphService],
})
export class SubgraphModule {}
