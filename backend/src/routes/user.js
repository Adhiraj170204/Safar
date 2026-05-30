import { Router } from "express";
import User from "../models/user.js";
import { wrapAsync, validate } from "../utility/middleware.js";
import { signupSchema, loginSchema, requestResetSchema, resetPasswordSchema, changePasswordSchema, setAuthCookie, clearAuthCookie, protect } from "../utility/auth.js";
import { upload } from "../config/multer.js";
import cloudinary from "../config/cloudinary.js";
import { cloudinaryUpload } from "../utility/cloudinaryUpload.js";
import { signAccessToken, signRefreshToken, hashToken, verifyRefresh } from "../utility/authToken.js";
import { sendVerification, sendResetPassword, generateOTP, sendOTPVerification } from "../utility/email.js";
import crypto from "crypto";

const router = Router();

// SIGNUP
router.post("/signup", validate(signupSchema), wrapAsync(async (req, res) => {
  const { name, email, password, username } = req.body;
  if (await User.findOne({ email })) return res.status(400).json({ error: "Email exists" });
  if (await User.findOne({ username })) return res.status(400).json({ error: "Username taken" });

  const user = new User({ name, email, password, username });
  await user.save();

  // Generate 6-digit OTP
  const otp = generateOTP();
  const otpHash = hashToken(otp);
  
  // Store OTP (10 mins expiry)
  user.refreshTokens.push({
    tokenHash: otpHash,
    expiresAt: new Date(Date.now() + 10*60*1000), // 10 mins
  });
  await user.save();
  
  await sendOTPVerification(user, otp);

  res.status(201).json({ message: "User created. Check your email for OTP.", email });
}));

// VERIFY OTP
router.post("/verify-otp", wrapAsync(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  if (user.verified) return res.status(400).json({ error: "Email already verified" });

  const otpHash = hashToken(otp);
  const tokenDoc = user.refreshTokens.find(t => t.tokenHash === otpHash && !t.revoked);

  if (!tokenDoc) return res.status(400).json({ error: "Invalid OTP" });
  if (tokenDoc.expiresAt < Date.now()) return res.status(400).json({ error: "OTP expired" });

  // Mark verified and revoke used OTP
  user.verified = true;
  tokenDoc.revoked = true;

  // Auto-login: Issue tokens
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });

  const hashed = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7d
  user.refreshTokens.push({ tokenHash: hashed, expiresAt });
  
  // Clean up old tokens if too many
  if (user.refreshTokens.length > 10) user.refreshTokens.shift();

  await user.save();

  setAuthCookie(res, "accessToken", accessToken, { maxAge: 1000 * 60 * 60 });
  setAuthCookie(res, "refreshToken", refreshToken, { maxAge: 1000 * 60 * 60 * 24 * 7 });

  res.json({
    message: "Email verified successfully",
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      verified: user.verified,
      profileImage: user.profileImage,
      favorites: user.favorites
    }
  });
}));

// RESEND OTP
router.post("/resend-otp", wrapAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });
  if (user.verified) return res.status(400).json({ error: "Email already verified" });

  // Rate limiting could go here (e.g. check last OTP time)

  // Generate new OTP
  const otp = generateOTP();
  const otpHash = hashToken(otp);

  // Mark old OTPs as revoked (optional, but good practice to avoid confusion)
  user.refreshTokens.forEach(t => {
    // Revoke any existing unexpired OTPs (heuristic: short expiry ones)
    // Or just revoke ALL previous tokens if you want strict single-session
    // For now, let's just add the new one.
  });

  user.refreshTokens.push({
    tokenHash: otpHash,
    expiresAt: new Date(Date.now() + 10*60*1000), // 10 mins
  });
  
  await user.save();
  await sendOTPVerification(user, otp);

  res.json({ message: "New OTP sent" });
}));

// LOGIN
router.post("/login", validate(loginSchema), wrapAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });

  // Check if email is verified
  if (!user.verified) {
    return res.status(403).json({ error: "Please verify your email before logging in" });
  }

  // create tokens
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });

  // store hashed refresh token (rotation)
  const hashed = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7d
  user.refreshTokens.push({ tokenHash: hashed, expiresAt });
  // optional: limit number of stored refresh tokens for user
  if (user.refreshTokens.length > 10) user.refreshTokens.shift();
  await user.save();

  setAuthCookie(res, "accessToken", accessToken, { maxAge: 1000 * 60 * 60 }); // 1h
  setAuthCookie(res, "refreshToken", refreshToken, { maxAge: 1000 * 60 * 60 * 24 * 7 }); // 7d

  res.json({ success: true, user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, verified: user.verified, profileImage: user.profileImage, favorites: user.favorites } });
}));

// REFRESH
router.post("/refresh", wrapAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  let payload;
  try { payload = verifyRefresh(token); } catch (e) { return res.status(401).json({ error: "Invalid refresh token" }); }

  const hashed = hashToken(token);
  
  const newRefreshToken = signRefreshToken({ id: payload.id, role: payload.role });
  const newHash = hashToken(newRefreshToken);
  const newExpires = new Date(Date.now() + 7*24*60*60*1000);

  // Atomic update to prevent VersionError race conditions
  const user = await User.findOneAndUpdate(
    { 
      _id: payload.id, 
      "refreshTokens": { 
        $elemMatch: { 
          tokenHash: hashed, 
          revoked: false,
          expiresAt: { $gt: new Date() }
        } 
      }
    },
    {
      $set: { "refreshTokens.$.revoked": true },
      $push: { 
        refreshTokens: { 
          $each: [{ tokenHash: newHash, expiresAt: newExpires }],
          $slice: -10 
        }
      }
    },
    { new: true } 
  );

  if (user) {
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    setAuthCookie(res, "accessToken", accessToken, { maxAge: 1000 * 60 * 60 });
    setAuthCookie(res, "refreshToken", newRefreshToken, { maxAge: 1000 * 60 * 60 * 24 * 7 });
    return res.json({ success: true });
  }

  // If update failed, determine why
  const diagUser = await User.findById(payload.id);
  if (!diagUser) return res.status(401).json({ error: "User not found" });

  const rtDoc = diagUser.refreshTokens.find(t => t.tokenHash === hashed);
  if (rtDoc && rtDoc.revoked) {
    // Reuse detected: revoke all tokens
    await User.updateOne({ _id: payload.id }, { $set: { "refreshTokens.$[].revoked": true } });
    return res.status(403).json({ error: "Refresh token reused" });
  }

  return res.status(401).json({ error: "Invalid or expired refresh token" });
}));

// LOGOUT
router.post("/logout", wrapAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    const hashed = hashToken(token);
    const user = await User.findOne({ "refreshTokens.tokenHash": hashed });
    if (user) {
      // revoke the matching token
      const doc = user.refreshTokens.find(t => t.tokenHash === hashed);
      if (doc) doc.revoked = true;
      await user.save();
    }
  }

  clearAuthCookie(res, "accessToken");
  clearAuthCookie(res, "refreshToken");
  res.json({ success: true });
}));

// REQUEST PASSWORD RESET
router.post("/request-reset", validate(requestResetSchema), wrapAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "If an account exists, you will receive an email." });

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetHash = hashToken(resetToken);
  user.refreshTokens.push({ tokenHash: resetHash, expiresAt: new Date(Date.now()+3600*1000) }); // 1h
  await user.save();
  await sendResetPassword(user, resetToken);
  res.json({ message: "If an account exists, you will receive an email." });
}));

// RESET PASSWORD
router.post("/reset", validate(resetPasswordSchema), wrapAsync(async (req, res) => {
  const { token, password } = req.body;
  const hashed = hashToken(token);
  const user = await User.findOne({ "refreshTokens.tokenHash": hashed });
  if (!user) return res.status(400).json({ error: "Invalid token" });

  const tokenDoc = user.refreshTokens.find(t => t.tokenHash === hashed && !t.revoked);
  if (!tokenDoc || tokenDoc.expiresAt < Date.now()) return res.status(400).json({ error: "Token expired" });

  user.password = password; // will be hashed by pre-save
  tokenDoc.revoked = true;
  await user.save();

  res.json({ message: "Password reset successful" });
}));

// GET USER PROFILE
router.get("/profile", protect, wrapAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -refreshTokens")
    .populate("createdCamps");
  
  if (!user) return res.status(404).json({ error: "User not found" });
  
  res.json(user);
}));

// GET USER'S CAMPS
router.get("/my-camps", protect, wrapAsync(async (req, res) => {
  const Camp = (await import("../models/camp.js")).default;
  
  const camps = await Camp.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("review");
  
  res.json({ 
    camps,
    count: camps.length 
  });
}));

// UPDATE USER PROFILE
router.put("/profile", protect, wrapAsync(async (req, res) => {
  const { name, username, profileImage } = req.body;
  
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Check if username is taken by another user
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }
    user.username = username;
  }

  if (name) user.name = name;
  if (profileImage) user.profileImage = profileImage;

  await user.save();

  res.json({
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      verified: user.verified,
      favorites: user.favorites
    }
  });
}));

// RESEND VERIFICATION EMAIL
router.post("/resend-verification", wrapAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.json({ message: "If an account exists, you will receive an email." });
  }

  if (user.verified) {
    return res.status(400).json({ error: "Email already verified" });
  }

  // Create new verification token
  const verifyToken = crypto.randomBytes(32).toString("hex");
  const verifyHash = hashToken(verifyToken);
  
  // Remove old verification tokens
  user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > Date.now() + 3600000);
  
  user.refreshTokens.push({
    tokenHash: verifyHash,
    expiresAt: new Date(Date.now() + 24*60*60*1000),
  });
  
  await user.save();
  await sendVerification(user, verifyToken);

  res.json({ message: "Verification email sent" });
}));

// GET CURRENT USER'S FAVORITE CAMPS (populated)
router.get("/favorites", protect, wrapAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "favorites",
    populate: { path: "user", select: "name username" }
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ camps: user.favorites });
}));

// TOGGLE A CAMP IN THE USER'S FAVORITES
router.post("/favorites/:campId", protect, wrapAsync(async (req, res) => {
  const { campId } = req.params;
  const Camp = (await import("../models/camp.js")).default;
  const camp = await Camp.findById(campId);
  if (!camp) return res.status(404).json({ error: "Camp not found" });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const idx = user.favorites.findIndex((f) => f.toString() === campId);
  let favorited;
  if (idx >= 0) {
    user.favorites.splice(idx, 1);
    favorited = false;
  } else {
    user.favorites.push(campId);
    favorited = true;
  }
  await user.save();

  res.json({ favorited, favorites: user.favorites });
}));

// PUBLIC USER PROFILE (no auth — view a user's camps)
router.get("/public/:username", wrapAsync(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .select("name username profileImage createdAt")
    .populate({
      path: "createdCamps",
      select: "title location cost images createdAt",
      options: { sort: { createdAt: -1 } }
    });
  if (!user) return res.status(404).json({ error: "User not found" });

  const Review = (await import("../models/review.js")).default;
  const reviewCount = await Review.countDocuments({ user: user._id });

  res.json({
    name: user.name,
    username: user.username,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
    camps: user.createdCamps,
    reviewCount
  });
}));

// CHANGE PASSWORD (requires current password)
router.post("/change-password", protect, validate(changePasswordSchema), wrapAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(400).json({ error: "Current password is incorrect" });

  user.password = newPassword; // hashed by pre-save hook
  await user.save();

  res.json({ message: "Password updated successfully" });
}));

// UPLOAD PROFILE IMAGE
router.post("/profile/image", protect, upload.single("image"), wrapAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Only JPEG, PNG, and WebP images are allowed" });
  }
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ error: "Image must be under 5MB" });
  }

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Delete old profile image from Cloudinary if it exists
  if (user.profileImage?.public_id) {
    await cloudinary.uploader.destroy(user.profileImage.public_id);
  }

  const result = await cloudinaryUpload(req.file.buffer, "profiles");
  user.profileImage = { url: result.secure_url, public_id: result.public_id };
  await user.save();

  res.json({
    message: "Profile image updated",
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      verified: user.verified,
      favorites: user.favorites,
    },
  });
}));

export default router;
