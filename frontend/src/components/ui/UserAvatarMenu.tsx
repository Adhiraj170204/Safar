import { User, Settings, LogOut, Tent, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";

interface UserAvatarMenuProps {
  user?: {
    name?: string;
    fullName?: string;
    profileImage?: {
      url?: string;
    };
  };
}

export function UserAvatarMenu({ user }: UserAvatarMenuProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/logUser");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full transition-all hover:ring-2 hover:ring-neutral-400 dark:hover:ring-neutral-600 focus:outline-hidden focus:ring-2 focus:ring-neutral-500 dark:focus:ring-white">
          <Avatar className="h-9 w-9 shadow-lg">
            <AvatarImage
              src={user?.profileImage?.url}
              alt={user?.fullName || "User"}
            />
            <AvatarFallback className="bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-neutral-200 dark:border-neutral-800"
      >
        <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">
            {user?.name || user?.fullName || "User"}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage your account</p>
        </div>

        <DropdownMenuItem asChild>
          <Link
            to="/profile"
            className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
          >
            <User className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm text-neutral-900 dark:text-white">Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            to="/my-camps"
            className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
          >
            <Tent className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm text-neutral-900 dark:text-white">My Camps</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            to="/favorites"
            className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
          >
            <Heart className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm text-neutral-900 dark:text-white">Favorites</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />

        <DropdownMenuItem asChild>
          <Link
            to="/change-password"
            className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
          >
            <Settings className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm text-neutral-900 dark:text-white">Change Password</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20"
        >
          <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-600 dark:text-red-400">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
