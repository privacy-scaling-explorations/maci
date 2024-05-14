import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import dotenv from "dotenv";
import helmet from "helmet";

import path from "path";

dotenv.config({ path: [path.resolve(__dirname, "../.env"), path.resolve(__dirname, "../.env.example")] });

async function bootstrap() {
  const { AppModule } = await import("./app.module");
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(helmet());
  app.enableCors({ origin: process.env.COORDINATOR_ALLOWED_ORIGIN });
  await app.listen(3000);
}

bootstrap();
