import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { defineConfig, type Config } from "drizzle-kit";

const tryLoadEnvFiles = () => {
  const cwd = process.cwd();
  const nodeEnv = process.env.NODE_ENV || "development";
  const candidates = [
    `.env.${nodeEnv}.local`,
    `.env.local`,
    `.env.${nodeEnv}`,
    `.env`,
  ];

  for (const file of candidates) {
    const full = path.resolve(cwd, file);
    if (fs.existsSync(full)) {
      dotenv.config({ path: full });
      return full;
    }
  }
  return null;
};

tryLoadEnvFiles();

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL no está definida. Asegúrate de tener .env, .env.local o .env.development.local y que contenga DATABASE_URL, o exporta la variable en el entorno."
  );
}

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
}) satisfies Config;
