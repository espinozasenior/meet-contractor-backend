import { PrismaClient } from "@prisma/client";
import { dbConnectionUri } from "./secrets";

// Use the Neon database connection from Encore's secret management
// instead of using Encore's SQLDatabase which requires Docker
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbConnectionUri(),
    },
  },
});

export { prisma };