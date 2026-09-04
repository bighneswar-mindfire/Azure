import "dotenv/config";
import express from "express";
import cors from "cors";
import documentsRouter from "./routes/documents.routes";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { runMigrations } from "./db/migrate";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/documents", documentsRouter);

app.use(errorHandler);

async function start(): Promise<void> {
  await runMigrations();
  app.listen(port, () => {
    console.log(`ClinicWorks server listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
