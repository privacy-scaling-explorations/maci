import { Module } from "@nestjs/common";

import { IpfsService } from "./ipfs.service";

@Module({
  exports: [IpfsService],
  providers: [IpfsService],
})
export class IpfsModule {}
