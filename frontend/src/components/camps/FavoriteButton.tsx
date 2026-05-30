import { useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/api/auth";

interface FavoriteButtonProps {
  campId: string;
  /** Floating heart over a card image vs. an inline labelled button */
  variant?: "icon" | "inline";
  /** Button size for the inline variant */
  size?: "default" | "sm" | "lg";
  className?: string;
  /** Called after a successful toggle with the new state (e.g. to drop from a list) */
  onToggled?: (favorited: boolean) => void;
}

export default function FavoriteButton({
  campId,
  variant = "icon",
  size = "default",
  className,
  onToggled,
}: FavoriteButtonProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, setFavorites } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const isFavorited = !!user?.favorites?.includes(campId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info("Log in to save camps to your favorites.", {
        action: { label: "Log in", onClick: () => navigate("/logUser") },
      });
      return;
    }

    setLoading(true);
    try {
      const { favorited, favorites } = await authAPI.toggleFavorite(campId);
      setFavorites(favorites);
      toast.success(favorited ? "Added to favorites" : "Removed from favorites");
      onToggled?.(favorited);
    } catch {
      toast.error("Couldn't update favorites. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "inline") {
    return (
      <Button
        type="button"
        size={size}
        variant={isFavorited ? "default" : "outline"}
        onClick={handleToggle}
        disabled={loading}
        className={className}
      >
        <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
        {isFavorited ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border border-border/50 transition-colors hover:bg-background disabled:opacity-60 ${className ?? ""}`}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"
        }`}
      />
    </button>
  );
}
