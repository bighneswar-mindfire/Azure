import "dotenv/config";
import express from "express";
import cors from "cors";
import documentsRouter from "./routes/documents.routes";
import { errorHandler } from "./middleware/errorHandler.middleware";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/documents", documentsRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`ClinicWorks server listening on port ${port}`);
});
