import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Tent, Star, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageCard } from "@/components/layout/ImageCard";
import { authAPI } from "@/api/auth";

interface PublicProfileData {
  name: string;
  username: string;
  profileImage?: { url: string };
  createdAt: string;
  camps: any[];
  reviewCount: number;
}

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await authAPI.getPublicProfile(username);
        setProfile(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-5 mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <User className="h-14 w-14 text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">User not found</h1>
        <p className="text-muted-foreground">
          We couldn't find a user with that username.
        </p>
      </div>
    );
  }

  const joined = new Date(profile.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-2">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.profileImage?.url} alt={profile.name} />
          <AvatarFallback>
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Tent className="h-4 w-4" />
              {profile.camps.length} {profile.camps.length === 1 ? "camp" : "camps"}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4" />
              {profile.reviewCount} {profile.reviewCount === 1 ? "review" : "reviews"}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Joined {joined}
            </span>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      <h2 className="text-xl font-semibold mb-4">
        Camps by {profile.name}
      </h2>

      {profile.camps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Tent className="h-10 w-10 opacity-30 mb-3" />
            <p>This user hasn't created any camps yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile.camps.map((camp) => (
            <ImageCard
              key={camp._id}
              campId={camp._id}
              image={camp.images?.[0]?.url ?? ""}
              title={camp.title || "Untitled"}
              description={camp.description || ""}
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
