import { useNavigate } from "react-router-dom";
import { Tent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FavoriteButton from "@/components/camps/FavoriteButton";

interface CampCardProps {
  title: string;
  description: string;
  location: string;
  image: string;
  id: string;
  tags?: string[];
  showFavorite?: boolean;
}

export default function CampCard({ title, description, location, image, id, tags, showFavorite = true }: CampCardProps) {
  const navigate = useNavigate();
  const visibleTags = tags?.slice(0, 3) ?? [];
  const extraCount = (tags?.length ?? 0) - visibleTags.length;

  return (
    <Card className="group overflow-hidden rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card border-border/50 hover:border-primary/20 dark:shadow-neutral-900/50 dark:hover:shadow-neutral-900/70">
      {/* Image Section */}
      <div className="relative overflow-hidden h-[280px] bg-muted">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Tent className="h-14 w-14 opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {showFavorite && (
          <div className="absolute top-3 right-3">
            <FavoriteButton campId={id} />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold leading-tight line-clamp-1 text-foreground">{title}</h3>

        {location && <p className="text-sm text-muted-foreground">{location}</p>}

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {extraCount > 0 && (
              <span className="text-xs text-muted-foreground self-center">+{extraCount} more</span>
            )}
          </div>
        )}

        <Button onClick={() => navigate(`/showCamp/${id}`)} className="w-full rounded-full mt-4" variant="default">
          View Details
        </Button>
      </div>
    </Card>
  );
}
