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
  const { AppModule } = await import("./app.module");
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
  app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(",") });

  const config = new DocumentBuilder()
    .setTitle("Relayer service")
    .setDescription("Relayer service API methods")
    .setVersion("1.0")
    .addTag("relayer")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
