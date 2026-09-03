import { Router } from "express";
import { uploadSingleDocument } from "../middleware/upload.middleware";
import * as documentsController from "../controllers/documents.controller";

const router = Router();

router.get("/", documentsController.listDocuments);
router.post("/upload", uploadSingleDocument, documentsController.uploadDocument);

export default router;
