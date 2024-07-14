import { defineConfig } from "drizzle-kit";
import dbCredentials from "./d1-credentials.json";

export default defineConfig({
  schema: "./src/db-schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials,
});
