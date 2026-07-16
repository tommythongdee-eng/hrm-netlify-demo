import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express, { type Express } from "express";
import { AppModule } from "./app.module";

// Builds and initializes the Nest app onto a caller-supplied Express instance,
// without calling .listen() — the HTTP listener is owned by whatever host
// process embeds this (a Netlify Function via handler.ts, or a plain local
// server for local testing), not by Nest itself.
export async function buildNestExpressApp(): Promise<Express> {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  const configService = app.get(ConfigService);

  const webOrigins = configService
    .get<string>("WEB_ORIGIN", "*")
    .split(",")
    .map((origin) => origin.trim());

  app.enableCors({
    origin: webOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix("api");

  await app.init();
  return expressApp;
}
