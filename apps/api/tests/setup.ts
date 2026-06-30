import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { generateKeyPairSync } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env.test") });

process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  "postgresql://test:test@localhost:5432/school_manage_test";
// Keep platform + tenant pools on the same test DB (do not inherit Render PLATFORM_DATABASE_URL from .env).
process.env.PLATFORM_DATABASE_URL =
  process.env.PLATFORM_DATABASE_URL_TEST ?? process.env.DATABASE_URL;
process.env.ALLOWED_ORIGINS = "http://localhost:3000";
process.env.MAX_LOGIN_ATTEMPTS = "5";
process.env.SESSION_INACTIVITY_MINUTES = "15";

if (!process.env.JWT_PRIVATE_KEY || !process.env.JWT_PUBLIC_KEY) {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  process.env.JWT_PRIVATE_KEY = privateKey;
  process.env.JWT_PUBLIC_KEY = publicKey;
}
