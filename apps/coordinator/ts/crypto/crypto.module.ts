import { Module } from "@nestjs/common";

import { CryptoService } from "./crypto.service";

@Module({
  exports: [CryptoService],
  providers: [CryptoService],
})
export class CryptoModule {}
