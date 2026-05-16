import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DATABASE_URL_UNPOOLED: Neon の unpooled 直接接続。Prisma CLI (db push) はこれを使う
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
