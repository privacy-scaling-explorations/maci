import { NestFactory } from "@nestjs/core";
import dotenv from "dotenv";
import helmet from "helmet";

import path from "path";

dotenv.config({ path: [path.resolve(__dirname, "../.env"), path.resolve(__dirname, "../.env.example")] });

async function bootstrap() {
  const { AppModule } = await import("./app.module");
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors();
  await app.listen(3000);
}

bootstrap();
