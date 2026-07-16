// Local-only dev entry (not used by the deployed Netlify Function — that goes
// through handler.ts). Lets you run/verify this standalone API copy on its own
// with `node dist/local.js`, listening on PORT (default 4000).
import { buildNestExpressApp } from "./bootstrap";

async function main() {
  const expressApp = await buildNestExpressApp();
  const port = Number(process.env.PORT ?? 4000);
  expressApp.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`HRM API (standalone netlify-demo copy) listening on http://localhost:${port}/api`);
  });
}

main();
