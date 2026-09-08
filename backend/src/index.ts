import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import documentsRouter from "./routes/documents.routes";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { runMigrations } from "./db/migrate";

const app = express();
const port = process.env.PORT ?? 4000;
const publicDir = path.join(__dirname, "..", "public");

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/documents", documentsRouter);

app.use(errorHandler);

app.use(express.static(publicDir));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

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
