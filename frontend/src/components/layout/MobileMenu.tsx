import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Tent,
  Settings,
  LogOut,
  Heart,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    fullName?: string;
    profileImage?: {
      url?: string;
    };
  } | null;
}

export function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate("/logUser");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Mobile Menu */}
      <div className="fixed top-16 left-0 right-0 z-50 md:hidden animate-in slide-in-from-top duration-300">
        <div className="bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 shadow-2xl">
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-6 space-y-4">
              {user ? (
                <>
                  {/* Logged In Menu */}
                  <div className="space-y-2">
                    <Link
                      to="/index"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <MapPin className="h-5 w-5" />
                      <span className="text-base font-medium">All Camps</span>
                    </Link>

                    <Link
                      to="/my-camps"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <Tent className="h-5 w-5" />
                      <span className="text-base font-medium">My Camps</span>
                    </Link>

                    <Link
                      to="/favorites"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <Heart className="h-5 w-5" />
                      <span className="text-base font-medium">Favorites</span>
                    </Link>
                  </div>

                  <Separator className="bg-neutral-200 dark:bg-neutral-800" />

                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span className="text-base font-medium">Profile</span>
                    </Link>

                    <Link
                      to="/indexMap"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <MapPin className="h-5 w-5" />
                      <span className="text-base font-medium">World Map</span>
                    </Link>

                    <Link
                      to="/change-password"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="text-base font-medium">Change Password</span>
                    </Link>
                  </div>

                  <Separator className="bg-neutral-200 dark:bg-neutral-800" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-base font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Logged Out Menu */}
                  <div className="space-y-2">
                    <Link
                      to="/index"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <MapPin className="h-5 w-5" />
                      <span className="text-base font-medium">All Camps</span>
                    </Link>

                    <Link
                      to="/newCamp"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <Tent className="h-5 w-5" />
                      <span className="text-base font-medium">Create Camp</span>
                    </Link>
                  </div>

                  <Separator className="bg-neutral-200 dark:bg-neutral-800" />

                  <div className="space-y-3 pt-2">
                    <Link to="/logUser" onClick={onClose} className="block">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                      >
                        Login
                      </Button>
                    </Link>

                    <Link to="/newUser" onClick={onClose} className="block">
                      <Button className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
