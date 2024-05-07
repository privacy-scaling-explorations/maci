import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";

import { ProofGeneratorService } from "./proof/proof.service";
import { IGenerateArgs, IGenerateData } from "./proof/types";

@Controller("v1/proof")
export class AppController {
  constructor(private readonly proofGeneratorService: ProofGeneratorService) {}

  @Post("generate")
  async generate(@Body() args: IGenerateArgs): Promise<IGenerateData> {
    return this.proofGeneratorService.generate(args).catch((error: Error) => {
      throw new HttpException("BadRequest", HttpStatus.BAD_REQUEST, { cause: error.message });
    });
  }
}
