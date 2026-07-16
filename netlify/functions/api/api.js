// The actual Netlify Function entry point. Deliberately plain JS (not
// TypeScript) so Netlify's function bundler never has to compile decorator
// metadata itself — it only needs to bundle this file plus the already-`tsc`
// -compiled Nest app under ./dist (see build.js), which is the whole point:
// esbuild (Netlify's default function bundler) strips TypeScript decorator
// syntax without emitting the `design:paramtypes` metadata Nest's constructor
// injection depends on, so the Nest app itself must never be compiled by it.
const fs = require("fs");
const path = require("path");
const serverless = require("serverless-http");

const DB_PATH = "/tmp/hrm-demo.db";
const SEED_TEMPLATE = path.join(__dirname, "prisma", "seed-template.db");
const UPLOADS_DIR = "/tmp/uploads";

let cachedHandler;

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.copyFileSync(SEED_TEMPLATE, DB_PATH);
  }
  process.env.DATABASE_URL = `file:${DB_PATH}`;
}

function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function ensureDemoDefaults() {
  // Baked-in demo secrets — insecure by design, documented in the README.
  // Fine for fake seeded data; never do this for a real deployment.
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "netlify-demo-insecure-access-secret-change-me";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "netlify-demo-insecure-refresh-secret-change-me";
  process.env.WEB_ORIGIN = process.env.WEB_ORIGIN || "*";
}

async function getHandler() {
  if (cachedHandler) return cachedHandler;

  ensureDemoDefaults();
  ensureDb();
  ensureUploadsDir();

  // Required only now (after DATABASE_URL is set) so nothing at module scope
  // touches Prisma before the DB file exists.
  const { buildNestExpressApp } = require("./dist/bootstrap");
  const expressApp = await buildNestExpressApp();
  cachedHandler = serverless(expressApp);
  return cachedHandler;
}

// Netlify's classic (v1) function signature: (event, context) -> response.
// Works with both a plain `/.netlify/functions/api` redirect target and the
// `netlify.toml` rewrite below.
exports.handler = async (event, context) => {
  // Netlify may hand this function the path as "/api/xxx", "/xxx", or
  // "/.netlify/functions/api/xxx" depending on the exact redirect/runtime
  // version — normalize it to always look like "/api/xxx" so it lines up
  // with Nest's setGlobalPrefix("api") regardless of which form shows up.
  let requestPath = event.path || "/";
  requestPath = requestPath.replace(/^\/\.netlify\/functions\/api/, "");
  if (!requestPath.startsWith("/api")) {
    requestPath = `/api${requestPath.startsWith("/") ? "" : "/"}${requestPath}`;
  }

  const handler = await getHandler();
  return handler({ ...event, path: requestPath }, context);
};
