import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/api/auth";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [profileData, setProfileData] = useState({
    name: "",
    username: "",
    email: "",
  });

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageSuccess, setImageSuccess] = useState("");

  // Resend verification state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/logUser");
      return;
    }
    if (user) {
      setProfileData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
      });
    }
  }, [user, isAuthenticated, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageError("");
    setImageSuccess("");
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    setImageLoading(true);
    setImageError("");
    setImageSuccess("");
    try {
      const result = await authAPI.uploadProfileImage(selectedFile);
      updateUser(result.user ?? result);
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageSuccess("Profile photo updated!");
      setTimeout(() => setImageSuccess(""), 3000);
    } catch (err: any) {
      setImageError(
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to upload image."
      );
    } finally {
      setImageLoading(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await authAPI.updateProfile(profileData);
      updateUser(result.user ?? result);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResendLoading(true);
    setResendMessage("");
    try {
      await authAPI.resendOTP(user.email);
      setResendMessage("Verification email sent! Check your inbox.");
    } catch {
      setResendMessage("Failed to send. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>

        {/* Email verification warning */}
        {user && user.verified === false && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Your email address is not verified.
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
              Some features may be limited until you verify your email.
            </p>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="border-yellow-400 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900"
              >
                {resendLoading ? "Sending..." : "Resend verification email"}
              </Button>
              {resendMessage && (
                <span className="text-xs text-yellow-700 dark:text-yellow-300">{resendMessage}</span>
              )}
            </div>
          </div>
        )}

        {/* Profile update messages */}
        {successMessage && (
          <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        {/* Profile Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={previewUrl ?? user?.profileImage?.url}
                    alt={user?.name}
                  />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                {previewUrl && (
                  <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1">
                    <Camera className="h-3 w-3" />
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3">
                {imageError && (
                  <p className="text-sm text-red-500">{imageError}</p>
                )}
                {imageSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">{imageSuccess}</p>
                )}

                {selectedFile ? (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={handleImageUpload}
                      disabled={imageLoading}
                    >
                      {imageLoading ? "Uploading..." : "Upload Photo"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelUpload}
                      disabled={imageLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG or WebP · Max 5MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-5 md:space-y-0 md:gap-4 md:grid md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => handleProfileChange("username", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate("/change-password")}>
              Change Password
            </Button>
            <Button variant="outline" onClick={() => navigate("/my-camps")}>
              My Camps
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
