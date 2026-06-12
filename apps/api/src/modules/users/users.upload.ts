import multer from "multer";
import path from "path";
import { tenantUploadDir } from "../../utils/tenantUploads.js";

const maxMb = Number(process.env.MAX_FILE_SIZE_MB ?? 2);

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      cb(null, tenantUploadDir(req, "users"));
    } catch (e) {
      cb(e instanceof Error ? e : new Error(String(e)), "");
    }
  },
  filename: (req, file, cb) => {
    const id = req.user?.id ?? "unknown";
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${id}${ext}`);
  },
});

export const userPhotoUpload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
});
