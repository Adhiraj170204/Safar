import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { adminAPI } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Tab = "stats" | "users" | "camps" | "reviews";

interface Stats {
  totalUsers: number;
  totalCamps: number;
  totalReviews: number;
  verifiedUsers: number;
  adminUsers: number;
  recentUsers?: { _id: string; name: string; username: string; email: string; role: string; createdAt: string }[];
  recentCamps?: { _id: string; title: string; location: string; user?: { name: string } }[];
}

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  isVerified?: boolean;
  profileImage?: { url: string };
}

interface Camp {
  _id: string;
  title: string;
  location: string;
  cost?: number;
  images?: { url: string }[];
  user?: { name: string; username: string };
}

interface Review {
  _id: string;
  rating: number;
  review?: string;
  user?: { name: string; username: string };
  camp?: { _id: string; title: string };
  createdAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("stats");

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);

  // Camps
  const [camps, setCamps] = useState<Camp[]>([]);
  const [campsLoading, setCampsLoading] = useState(false);
  const [campsError, setCampsError] = useState("");
  const [campPage, setCampPage] = useState(1);
  const [campTotalPages, setCampTotalPages] = useState(1);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError("");
    try {
      const data = await adminAPI.getStats();
      setStats({
        ...data.stats,
        recentUsers: data.recentActivity?.users,
        recentCamps: data.recentActivity?.camps,
      });
    } catch {
      setStatsError("Failed to load stats.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const data = await adminAPI.getUsers({ page: userPage, search: userSearch, limit: 10 });
      setUsers(data.users ?? data);
      setUserTotalPages(data.pages ?? data.totalPages ?? 1);
    } catch {
      setUsersError("Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }, [userPage, userSearch]);

  const fetchCamps = useCallback(async () => {
    setCampsLoading(true);
    setCampsError("");
    try {
      const data = await adminAPI.getAllCamps({ page: campPage, limit: 10 });
      setCamps(data.camps ?? data);
      setCampTotalPages(data.pages ?? data.totalPages ?? 1);
    } catch {
      setCampsError("Failed to load camps.");
    } finally {
      setCampsLoading(false);
    }
  }, [campPage]);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError("");
    try {
      const data = await adminAPI.getAllReviews({ page: reviewPage, limit: 10 });
      setReviews(data.reviews ?? data);
      setReviewTotalPages(data.pages ?? data.totalPages ?? 1);
    } catch {
      setReviewsError("Failed to load reviews.");
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewPage]);

  useEffect(() => {
    if (activeTab === "stats") fetchStats();
  }, [activeTab, fetchStats]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (activeTab === "camps") fetchCamps();
  }, [activeTab, fetchCamps]);

  useEffect(() => {
    if (activeTab === "reviews") fetchReviews();
  }, [activeTab, fetchReviews]);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`Role updated to ${newRole}.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to update role.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success("User deleted.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to delete user.");
    }
  };

  const handleDeleteCamp = async (campId: string) => {
    try {
      await adminAPI.deleteCamp(campId);
      setCamps((prev) => prev.filter((c) => c._id !== campId));
      toast.success("Camp deleted.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to delete camp.");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await adminAPI.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success("Review deleted.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to delete review.");
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "stats", label: "Stats" },
    { key: "users", label: "Users" },
    { key: "camps", label: "Camps" },
    { key: "reviews", label: "Reviews" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage users, camps, and reviews</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-8 border-b pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {activeTab === "stats" && (
        <div>
          {statsLoading && <p className="text-muted-foreground">Loading stats...</p>}
          {statsError && <p className="text-red-500">{statsError}</p>}
          {stats && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {[
                  { label: "Total Users", value: stats.totalUsers },
                  { label: "Total Camps", value: stats.totalCamps },
                  { label: "Total Reviews", value: stats.totalReviews },
                  { label: "Verified Users", value: stats.verifiedUsers },
                  { label: "Admin Users", value: stats.adminUsers },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{stat.value ?? "—"}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {stats.recentUsers && stats.recentUsers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Users</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {stats.recentUsers.map((u) => (
                        <div key={u._id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-muted-foreground">{u.email}</p>
                          </div>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                            {u.role}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {stats.recentCamps && stats.recentCamps.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Camps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {stats.recentCamps.map((c) => (
                        <div key={c._id} className="text-sm">
                          <p className="font-medium">{c.title}</p>
                          <p className="text-muted-foreground">
                            {c.location}
                            {c.user ? ` · by ${c.user.name}` : ""}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div>
          <div className="flex gap-3 mb-6">
            <Input
              placeholder="Search by name, username, or email..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
              className="max-w-sm"
            />
          </div>

          {usersLoading && <p className="text-muted-foreground">Loading users...</p>}
          {usersError && <p className="text-red-500">{usersError}</p>}

          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user._id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImage?.url} />
                      <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username} · {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRoleToggle(user._id, user.role)}
                      >
                        {user.role === "admin" ? "Make User" : "Make Admin"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>{user.name}</strong> and all their data. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user._id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!usersLoading && users.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No users found.</p>
          )}

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={userPage <= 1}
              onClick={() => setUserPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {userPage} of {userTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={userPage >= userTotalPages}
              onClick={() => setUserPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── CAMPS TAB ── */}
      {activeTab === "camps" && (
        <div>
          {campsLoading && <p className="text-muted-foreground">Loading camps...</p>}
          {campsError && <p className="text-red-500">{campsError}</p>}

          <div className="space-y-3">
            {camps.map((camp) => (
              <Card key={camp._id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {camp.images && camp.images[0] ? (
                      <img
                        src={camp.images[0].url}
                        alt={camp.title}
                        className="h-14 w-20 object-cover rounded-md shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-20 bg-muted rounded-md shrink-0 flex items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{camp.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {camp.location}
                        {camp.user ? ` · by ${camp.user.name}` : ""}
                      </p>
                      {camp.cost !== undefined && (
                        <p className="text-sm font-medium">₹{camp.cost}/night</p>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="shrink-0">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Camp</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{camp.title}</strong> and all its reviews. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCamp(camp._id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!campsLoading && camps.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No camps found.</p>
          )}

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={campPage <= 1}
              onClick={() => setCampPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {campPage} of {campTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={campPage >= campTotalPages}
              onClick={() => setCampPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === "reviews" && (
        <div>
          {reviewsLoading && <p className="text-muted-foreground">Loading reviews...</p>}
          {reviewsError && <p className="text-red-500">{reviewsError}</p>}

          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review._id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {review.user?.name ?? "Unknown"}
                        </p>
                        <span className="text-muted-foreground text-xs">
                          @{review.user?.username}
                        </span>
                        <span className="text-yellow-500 text-sm">
                          {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                        </span>
                      </div>
                      {review.camp && (
                        <p className="text-xs text-muted-foreground mb-1">
                          Camp: {review.camp.title}
                        </p>
                      )}
                      {review.review && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.review}
                        </p>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="shrink-0">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this review. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteReview(review._id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!reviewsLoading && reviews.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No reviews found.</p>
          )}

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={reviewPage <= 1}
              onClick={() => setReviewPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {reviewPage} of {reviewTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={reviewPage >= reviewTotalPages}
              onClick={() => setReviewPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Separator className="mt-12 mb-4" />
      <p className="text-xs text-muted-foreground text-center">Admin panel · Safar</p>
    </div>
  );
}
