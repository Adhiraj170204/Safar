import mongoose from "mongoose";
import bcrypt from "bcrypt";

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true }, // SHA256 of refresh token
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  replacedByTokenHash: { type: String, default: null },
  revoked: { type: Boolean, default: false },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  profileImage: { url: String, public_id: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  verified: { type: Boolean, default: false },
  createdCamps: [{ type: mongoose.Schema.Types.ObjectId, ref: "Camp" }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Camp" }],
  refreshTokens: [RefreshTokenSchema],
}, { timestamps: true });

// Hash password before save
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// Compare
UserSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
