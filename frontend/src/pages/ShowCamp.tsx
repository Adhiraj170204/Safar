import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import FavoriteButton from "@/components/camps/FavoriteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Autoplay from "embla-carousel-autoplay";
import Loading from "@/components/ui/loading";
import MiniMap from "@/components/maps/MiniMap";
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
import { campAPI } from "@/api/camps";
import { reviewAPI } from "@/api/reviews";
import { useAuthStore } from "@/store/authStore";

interface Review {
  _id: string;
  rating: number;
  review?: string;
  user?: { _id: string; name: string; username: string; profileImage?: { url: string } };
  createdAt: string;
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-2xl leading-none transition-colors disabled:cursor-default ${
            star <= (hovered || value)
              ? "text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ShowCamp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [camp, setCamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    if (!id) return;
    campAPI.getCamp(id)
      .then(data => {
        setCamp(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch camp details");
        setLoading(false);
      });
  }, [id]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const data = await reviewAPI.getReviews(id);
      setReviews(Array.isArray(data) ? data : data.reviews ?? []);
    } catch {
      // non-critical — reviews just won't show
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await campAPI.deleteCamp(id);
      toast.success("Camp deleted.");
      navigate("/index");
    } catch {
      toast.error("Failed to delete camp.");
      setIsDeleting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0) {
      setReviewError("Please select a rating.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    setReviewSuccess("");
    try {
      await reviewAPI.createReview(id!, { rating: newRating, review: newText.trim() || undefined });
      setNewRating(0);
      setNewText("");
      setReviewSuccess("Review submitted!");
      toast.success("Review submitted!");
      await fetchReviews();
      setTimeout(() => setReviewSuccess(""), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to submit review.";
      setReviewError(msg);
      toast.error(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!id) return;
    try {
      await reviewAPI.deleteReview(id, reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success("Review deleted.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to delete review.");
    }
  };

  const getCampUserId = () => {
    if (!camp?.user) return null;
    if (typeof camp.user === "string") return camp.user;
    return camp.user._id || camp.user.id;
  };

  const canEdit = React.useMemo(() => {
    if (authLoading || !camp) return false;
    if (!isAuthenticated || !user) return false;
    const campUserId = getCampUserId();
    return user.id === campUserId || user.role === "admin";
  }, [authLoading, isAuthenticated, user, camp]);

  const canDeleteReview = (review: Review) => {
    if (!isAuthenticated || !user) return false;
    if (user.role === "admin") return true;
    return review.user?._id === user.id;
  };

  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  const hasUserReviewed = isAuthenticated && user
    ? reviews.some((r) => r.user?._id === user.id)
    : false;

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error || !camp) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error || "Camp not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative w-full">
        {camp.images && camp.images.length > 0 && (
          <Carousel
            plugins={[Autoplay({ delay: 3000 })]}
            className="w-full"
          >
            <CarouselContent>
              {camp.images.map((image: any, index: number) => (
                <CarouselItem key={index}>
                  <div className="relative w-full h-[400px] md:h-[500px]">
                    <img
                      src={image.url}
                      alt={`${camp.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 -mt-16 relative z-10 max-w-6xl">
        <Card className="shadow-2xl dark:shadow-neutral-900/70 rounded-2xl overflow-hidden">
          <CardContent className="p-6 md:p-8">
            {/* Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">{camp.title}</h1>
                <p className="text-muted-foreground text-lg">{camp.location}</p>
              </div>
              <div className="flex gap-3 items-center">
                {id && <FavoriteButton campId={id} variant="inline" size="lg" />}
                {canEdit && (
                  <>
                  <Button onClick={() => navigate(`/editCamp/${id}`)} variant="outline" size="lg">
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="lg" disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the camp
                          "{camp.title}" and all associated reviews.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </>
                )}
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">Description</h2>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {camp.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-6">
                  {camp.cost && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Price</h3>
                      <Badge variant="secondary" className="text-xl px-6 py-3 font-bold">
                        ₹{camp.cost}
                      </Badge>
                    </div>
                  )}
                  {camp.user && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Author</h3>
                      {typeof camp.user === "string" ? (
                        <p className="text-lg font-medium text-foreground">{camp.user}</p>
                      ) : camp.user.username ? (
                        <Link
                          to={`/user/${camp.user.username}`}
                          className="text-lg font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {camp.user.username}
                        </Link>
                      ) : (
                        <p className="text-lg font-medium text-foreground">Unknown</p>
                      )}
                    </div>
                  )}
                </div>

                {camp.tags && camp.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {camp.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Map */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">Location</h2>
                  {camp.geometry?.coordinates && Array.isArray(camp.geometry.coordinates) && camp.geometry.coordinates.length === 2 ? (
                    <MiniMap
                      coordinates={camp.geometry.coordinates as [number, number]}
                      title={camp.title}
                    />
                  ) : (
                    <div className="w-full h-[260px] rounded-xl border border-border bg-muted/30 flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">Location not available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* ── REVIEWS SECTION ── */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-foreground">Reviews</h2>
                {averageRating !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-xl">★</span>
                    <span className="font-bold text-lg">{averageRating}</span>
                    <span className="text-muted-foreground text-sm">
                      ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
                {reviews.length === 0 && !reviewsLoading && (
                  <span className="text-muted-foreground text-sm">No reviews yet</span>
                )}
              </div>

              {/* Add Review Form */}
              {isAuthenticated ? (
                !hasUserReviewed ? (
                  <Card className="mb-6">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-4">Leave a Review</h3>
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Your rating</p>
                          <StarRating value={newRating} onChange={setNewRating} />
                        </div>
                        <div>
                          <Textarea
                            placeholder="Share your experience (optional)"
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            disabled={reviewSubmitting}
                            rows={3}
                          />
                        </div>
                        {reviewError && (
                          <p className="text-sm text-red-500">{reviewError}</p>
                        )}
                        {reviewSuccess && (
                          <p className="text-sm text-green-600 dark:text-green-400">{reviewSuccess}</p>
                        )}
                        <Button type="submit" disabled={reviewSubmitting}>
                          {reviewSubmitting ? "Submitting..." : "Submit Review"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground mb-6">You have already reviewed this camp.</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground mb-6">
                  <Link to="/logUser" className="text-primary hover:underline">Log in</Link> to leave a review.
                </p>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <p className="text-muted-foreground text-sm">Loading reviews...</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review._id}>
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage src={review.user?.profileImage?.url} />
                              <AvatarFallback>
                                {review.user?.name?.charAt(0).toUpperCase() ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {review.user?.username ? (
                                  <Link to={`/user/${review.user.username}`} className="font-medium text-sm hover:text-primary hover:underline">
                                    {review.user?.name ?? "Anonymous"}
                                  </Link>
                                ) : (
                                  <p className="font-medium text-sm">{review.user?.name ?? "Anonymous"}</p>
                                )}
                                <span className="text-muted-foreground text-xs">@{review.user?.username}</span>
                                <span className="text-yellow-400 text-sm">
                                  {"★".repeat(review.rating)}
                                  <span className="text-muted-foreground/30">{"★".repeat(5 - review.rating)}</span>
                                </span>
                              </div>
                              {review.review && (
                                <p className="text-sm text-muted-foreground">{review.review}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          {canDeleteReview(review) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0">
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
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-8" />

            {/* Footer */}
            <div className="flex justify-center">
              <Button onClick={() => navigate("/index")} variant="outline" size="lg" className="px-8">
                Back to All Camps
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-16" />
    </div>
  );
}
