import fs from "fs";
import multer from "multer";
import path from "path";
import { tenantUploadDir } from "../../utils/tenantUploads.js";

const maxMb = Number(process.env.MAX_FILE_SIZE_MB ?? 2);

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      cb(null, tenantUploadDir(req, "settings"));
    } catch (e) {
      cb(e instanceof Error ? e : new Error(String(e)), "");
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `school-logo${ext}`);
  },
});

export const schoolLogoUpload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(ext)) {
      cb(new Error("Only JPG, PNG, WebP, and SVG images are allowed"));
      return;
    }
    cb(null, true);
  },
});
