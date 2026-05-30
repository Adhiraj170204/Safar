import { Tent } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/camps/FavoriteButton";

interface ImageCardProps {
  image: string;
  title: string;
  description: string;
  location?: string;
  cost?: number;
  campId?: string;
  onShowMore?: () => void;
}

export function ImageCard({
  image,
  title,
  description,
  location,
  cost,
  campId,
  onShowMore,
}: ImageCardProps) {
  return (
    <Card className="group overflow-hidden max-w-sm hover:shadow-lg transition-all duration-300">
      {/* Image Section */}
      <div className="relative h-64 w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <Tent className="h-12 w-12 opacity-40" />
          </div>
        )}
        {campId && (
          <div className="absolute top-3 right-3">
            <FavoriteButton campId={campId} />
          </div>
        )}
      </div>

      {/* Content Section */}
      <CardHeader>
        <CardTitle className="text-2xl leading-tight">{title}</CardTitle>
        {(location || cost !== undefined) && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {location && <span>{location}</span>}
            {location && cost !== undefined && <span>·</span>}
            {cost !== undefined && <span className="font-medium">₹{cost}/night</span>}
          </div>
        )}
        <CardDescription className="text-sm leading-relaxed line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>

      {/* Footer with Button */}
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={onShowMore}
        >
          Show More
        </Button>
      </CardFooter>
    </Card>
  );
}
