import * as path from "path";

// A plain constant rather than reading from ConfigService: @UseInterceptors()
// decorator arguments (including FileInterceptor's multer storage engine) are
// evaluated at class-definition time, before Nest's DI container — and before
// ConfigModule has loaded .env — even exists. Keeping this dependency-free
// avoids that ordering trap.
//
// Under a Netlify Function the filesystem is read-only except /tmp (which is
// ephemeral — wiped on cold start), so uploaded documents and dev-mode emails
// only persist for the lifetime of a warm container. That's an accepted,
// disclosed tradeoff for this standalone demo copy, not a bug.
const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
export const UPLOADS_ROOT = isServerless ? "/tmp/uploads" : path.resolve(process.cwd(), "uploads");
