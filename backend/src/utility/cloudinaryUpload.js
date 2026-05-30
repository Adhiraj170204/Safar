import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const cloudinaryUpload = (fileBuffer, folder = "camps") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};
