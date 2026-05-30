import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/ui/loading";
import CampCard from "@/components/camps/CampCard";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/api/client";

export default function MyCamps() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/logUser");
      return;
    }

    const fetchMyCamps = async () => {
      try {
        const response = await apiClient.get("/user/my-camps");
        setCamps(response.data.camps || []);
        setLoading(false);
      } catch (error: any) {
        setError(error.response?.data?.error || "Failed to fetch your camps");
        setLoading(false);
      }
    };

    fetchMyCamps();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Camps</h1>
          <p className="text-muted-foreground mt-1">
            Manage your camping spots
          </p>
        </div>
        <Button onClick={() => navigate("/newCamp")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Camp
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md mb-6">
          {error}
        </div>
      )}

      {camps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="text-6xl">🏕️</div>
              <h2 className="text-2xl font-semibold text-foreground">
                No camps yet
              </h2>
              <p className="text-muted-foreground max-w-md">
                You haven't created any camps yet. Start by creating your first
                camping spot!
              </p>
              <Button onClick={() => navigate("/newCamp")} className="gap-2 mt-4">
                <Plus className="h-4 w-4" />
                Create Your First Camp
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {camps.length} {camps.length === 1 ? "camp" : "camps"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {camps.map((camp) => (
              <CampCard
                key={camp._id}
                id={camp._id}
                title={camp.title || "Untitled"}
                description={camp.description || "No description available"}
                location={camp.location || ""}
                image={camp.images?.[0]?.url ?? ""}
                tags={camp.tags}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
