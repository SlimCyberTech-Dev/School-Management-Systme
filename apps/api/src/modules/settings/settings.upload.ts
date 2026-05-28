import fs from "fs";
import multer from "multer";
import path from "path";

const uploadRoot = process.env.UPLOAD_DIR ?? "./uploads";
const maxMb = Number(process.env.MAX_FILE_SIZE_MB ?? 2);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadRoot, "settings");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
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
