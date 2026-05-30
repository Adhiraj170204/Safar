import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageCard } from "@/components/layout/ImageCard";
import { authAPI } from "@/api/auth";

export default function Favorites() {
  const navigate = useNavigate();
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authAPI.getFavorites();
        setCamps(data.camps ?? []);
      } catch {
        toast.error("Failed to load your favorites.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-7 w-7 fill-red-500 text-red-500" />
        <h1 className="text-3xl font-bold">Your Favorites</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : camps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Heart className="h-14 w-14 text-muted-foreground/30" />
            <h2 className="text-2xl font-semibold">No favorites yet</h2>
            <p className="text-muted-foreground max-w-md">
              Tap the heart on any camp to save it here for later.
            </p>
            <Button onClick={() => navigate("/index")} className="mt-2">
              Browse Camps
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {camps.map((camp) => (
            <ImageCard
              key={camp._id}
              campId={camp._id}
              image={camp.images?.[0]?.url ?? ""}
              title={camp.title || "Untitled"}
              description={camp.description || "No description available"}
              location={camp.location}
              cost={camp.cost}
              onShowMore={() => navigate(`/showCamp/${camp._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
