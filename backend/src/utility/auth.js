import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/, "must contain uppercase")
                         .regex(/[^A-Za-z0-9]/, "must contain special character"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  // no body needed; cookie-based
  body: z.object({}),
});

export const requestResetSchema = z.object({
  body: z.object({ email: z.string().email() }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[^A-Za-z0-9]/),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  }),
});

import { verifyAccess } from "../utility/authToken.js";
import User from "../models/user.js";

const isTunnel = process.env.TUNNEL_MODE === "true";
const isSecure = process.env.COOKIE_SECURE === "true" || isTunnel;

const authCookieOptions = () => ({
  httpOnly: true,
  secure: isSecure,
  sameSite: isSecure ? "none" : "lax",
  domain: isTunnel ? undefined : (process.env.COOKIE_DOMAIN || undefined),
});

export const setAuthCookie = (res, tokenName, tokenValue, opts = {}) => {
  res.cookie(tokenName, tokenValue, { ...authCookieOptions(), ...opts });
};

export const clearAuthCookie = (res, tokenName) => {
  res.clearCookie(tokenName, authCookieOptions());
};

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const decoded = verifyAccess(token);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ error: "User no longer exists" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Requires admin" });
  next();
};

export const isOwnerOrAdmin = (resourceOwnerIdField = "user") => {
  return (req, res, next) => {
    const ownerId = req.resource?.[resourceOwnerIdField] || req.resourceOwnerId;
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (req.user.role === "admin") return next();
    if (!ownerId) return res.status(403).json({ error: "Ownership unknown" });
    if (ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ error: "Not owner" });
    next();
  };
};

