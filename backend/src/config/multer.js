import multer from "multer";

const storage = multer.memoryStorage();

// 5MB per file — matches the profile-image route check and the UI helper text.
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
