import Router from "express";
import handleFileUpload from "../controller/file.controller";
import { uploadExcel } from "../config/multer";

const router = Router();

router.post("/upload", uploadExcel.single("file"), handleFileUpload);

export default router;
