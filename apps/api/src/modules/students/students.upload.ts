import fs from "fs";
import multer from "multer";
import path from "path";

const uploadRoot = process.env.UPLOAD_DIR ?? "./uploads";
const maxMb = Number(process.env.MAX_FILE_SIZE_MB ?? 2);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(uploadRoot, "students");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const id = req.params["id"] ?? "unknown";
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${id}${ext}`);
  },
});

export const studentPhotoUpload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png"].includes(ext)) {
      cb(new Error("Only JPEG and PNG images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export function getUploadRoot(): string {
  return uploadRoot;
}
