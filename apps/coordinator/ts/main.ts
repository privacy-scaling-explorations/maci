import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import dotenv from "dotenv";
import helmet from "helmet";

import path from "path";
import url from "url";

/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-shadow */
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-shadow */

dotenv.config({
  path: [path.resolve(__dirname, "../.env"), path.resolve(__dirname, "../.env.example")],
});

async function bootstrap() {
  const { AppModule } = await import("./app.module.js");
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "fatal", "error", "warn"],
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, "data:", "validator.swagger.io"],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        },
      },
    }),
  );
  app.enableCors({ origin: process.env.COORDINATOR_ALLOWED_ORIGINS?.split(",") });

  const config = new DocumentBuilder()
    .setTitle("Coordinator service")
    .setDescription("Coordinator service API methods")
    .setVersion("1.0")
    .addTag("coordinator")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(process.env.COORDINATOR_PORT || 3000);
}

bootstrap();
