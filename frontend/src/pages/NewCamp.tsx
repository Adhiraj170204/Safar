import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { campAPI } from "@/api/camps"
import { useAuthStore } from "@/store/authStore"
import { TAGS_BY_GROUP } from "@/lib/tags"

const campSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  cost: z.string().refine(
    (val) => { const n = parseFloat(val); return !isNaN(n) && n >= 0; },
    { message: "Cost must be a valid positive number" }
  ),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  images: z.instanceof(FileList).optional(),
  longitude: z.string().optional(),
  latitude: z.string().optional(),
}).refine((data) => {
  if (data.images && data.images.length > 0) {
    const maxSize = 3 * 1024 * 1024;
    for (let i = 0; i < data.images.length; i++) {
      const file = data.images[i];
      if (!file.type.startsWith("image/") || file.size > maxSize) return false;
    }
  }
  return true;
}, { message: "Images must be valid image files and less than 3MB each", path: ["images"] })
.refine((data) => {
  const hasLng = data.longitude && data.longitude.trim() !== "";
  const hasLat = data.latitude && data.latitude.trim() !== "";
  if (hasLng !== hasLat) return false;
  return true;
}, { message: "Both longitude and latitude are required together", path: ["longitude"] });

type CampFormData = z.infer<typeof campSchema>;

export default function NewCamp() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/logUser");
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CampFormData>({ resolver: zodResolver(campSchema) });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const onSubmit = async (data: CampFormData) => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("location", data.location);
      formData.append("cost", parseFloat(data.cost).toString());
      formData.append("description", data.description);
      if (selectedTags.length > 0) formData.append("tags", selectedTags.join(","));

      const lng = data.longitude?.trim();
      const lat = data.latitude?.trim();
      if (lng && lat) {
        formData.append("longitude", lng);
        formData.append("latitude", lat);
      }

      if (data.images && data.images.length > 0) {
        for (let i = 0; i < data.images.length; i++) {
          formData.append("images", data.images[i]);
        }
      }

      const camp = await campAPI.createCamp(formData);
      setSuccessMessage("Camp created successfully!");
      reset();
      setSelectedTags([]);
      setTimeout(() => navigate(`/showCamp/${camp._id}`), 1500);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to create camp. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Camp</CardTitle>
          <CardDescription>Fill in the form below to create a new camping spot</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className={cn("flex flex-col gap-6")}>
            <FieldGroup>
              {successMessage && (
                <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md text-sm">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md text-sm">
                  {errorMessage}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input id="title" type="text" placeholder="Enter camp title" {...register("title")} disabled={loading} />
                {errors.title && <FieldDescription className="text-red-500">{errors.title.message}</FieldDescription>}
              </Field>

              <Field>
                <FieldLabel htmlFor="cost">Cost per night (₹)</FieldLabel>
                <Input id="cost" type="number" placeholder="0" step="0.01" min="0" {...register("cost")} disabled={loading} />
                {errors.cost && <FieldDescription className="text-red-500">{errors.cost.message}</FieldDescription>}
              </Field>

              <Field>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <Input id="location" type="text" placeholder="Enter camp location" {...register("location")} disabled={loading} />
                {errors.location && <FieldDescription className="text-red-500">{errors.location.message}</FieldDescription>}
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" placeholder="Enter a detailed description of the camp" rows={5} {...register("description")} disabled={loading} />
                {errors.description && <FieldDescription className="text-red-500">{errors.description.message}</FieldDescription>}
              </Field>

              {/* Coordinates */}
              <Field>
                <FieldLabel>
                  Coordinates{" "}
                  <span className="text-muted-foreground font-normal text-sm">(optional — shows camp on map)</span>
                </FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" step="any" placeholder="Longitude (e.g. 77.21)" {...register("longitude")} disabled={loading} />
                  <Input type="number" step="any" placeholder="Latitude (e.g. 28.61)" {...register("latitude")} disabled={loading} />
                </div>
                {errors.longitude && <FieldDescription className="text-red-500">{errors.longitude.message}</FieldDescription>}
              </Field>

              {/* Images */}
              <Field>
                <FieldLabel htmlFor="images">Images</FieldLabel>
                <Input id="images" type="file" accept="image/*" multiple {...register("images")} disabled={loading} />
                {errors.images && <FieldDescription className="text-red-500">{errors.images.message}</FieldDescription>}
                {!errors.images && <FieldDescription>Upload 1–5 images (max 3MB each)</FieldDescription>}
              </Field>

              {/* Tag picker */}
              <Field>
                <FieldLabel>Tags</FieldLabel>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        disabled={loading}
                        className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-semibold disabled:opacity-50"
                      >
                        {tag}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagPicker((v) => !v)}
                  disabled={loading}
                >
                  {showTagPicker ? "Hide tag picker" : "Add tags"}
                </Button>

                {showTagPicker && (
                  <div className="max-h-60 overflow-y-auto border border-border rounded-md p-3 mt-2 space-y-3">
                    {Object.entries(TAGS_BY_GROUP).map(([group, tags]) => (
                      <div key={group}>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">{group}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              disabled={loading}
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                                selectedTags.includes(tag)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <FieldDescription>
                  {selectedTags.length > 0
                    ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""} selected`
                    : "Select tags to help others discover your camp"}
                </FieldDescription>
              </Field>

              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating Camp..." : "Create Camp"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
