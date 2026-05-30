import jwt from "jsonwebtoken";
import crypto from "crypto";

export const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "1h",
  });
};

export const signRefreshToken = (payload) => {
  // include random jti
  const token = jwt.sign({ ...payload, jti: crypto.randomBytes(16).toString("hex") },
    process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" });
  return token;
};

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const verifyAccess = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

export const verifyRefresh = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);
