import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import Loading from "@/components/ui/loading"
import { useAuthStore } from "@/store/authStore"
import { campAPI } from "@/api/camps"
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

interface ExistingImage {
  url: string;
  filename?: string;
  _id?: string;
}

export default function EditCamp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CampFormData>({ resolver: zodResolver(campSchema) });

  useEffect(() => {
    if (!isAuthenticated) navigate("/logUser");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchCampData = async () => {
      try {
        const camp = await campAPI.getCamp(id!);
        const ownerId = typeof camp.user === "string" ? camp.user : camp.user?._id;

        if (user && user.id !== ownerId && user.role !== "admin") {
          setErrorMessage("You are not authorized to edit this camp");
          setTimeout(() => navigate(`/showCamp/${id}`), 2000);
          return;
        }

        setValue("title", camp.title || "");
        setValue("location", camp.location || "");
        setValue("cost", (camp.price ?? camp.cost ?? 0).toString());
        setValue("description", camp.description || "");

        if (camp.tags && Array.isArray(camp.tags)) {
          setSelectedTags(camp.tags);
        }

        if (camp.geometry?.coordinates?.length === 2) {
          setValue("longitude", camp.geometry.coordinates[0].toString());
          setValue("latitude", camp.geometry.coordinates[1].toString());
        }

        if (camp.images && Array.isArray(camp.images)) {
          setExistingImages(camp.images);
        }

        setFetchingData(false);
      } catch {
        setErrorMessage("Failed to load camp data");
        setFetchingData(false);
      }
    };

    if (id && user) fetchCampData();
  }, [id, setValue, user, navigate]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDeleteExistingImage = (image: ExistingImage) => {
    const filename = image.filename || image.url.split("/").pop()?.split(".")[0] || "";
    setImagesToDelete((prev) => [...prev, filename]);
    setExistingImages((prev) => prev.filter((img) => img.url !== image.url));
  };

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    const filesArray = Array.from(files);
    setNewImageFiles(filesArray);
    setNewImagePreviews(filesArray.map((f) => URL.createObjectURL(f)));
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    const updatedFiles = newImageFiles.filter((_, i) => i !== index);
    const updatedPreviews = newImagePreviews.filter((_, i) => i !== index);
    setNewImageFiles(updatedFiles);
    setNewImagePreviews(updatedPreviews);
    const dt = new DataTransfer();
    updatedFiles.forEach((f) => dt.items.add(f));
    const input = document.getElementById("images") as HTMLInputElement;
    if (input) input.files = dt.files;
  };

  useEffect(() => {
    return () => newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [newImagePreviews]);

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

      if (imagesToDelete.length > 0) {
        formData.append("imagesToDelete", imagesToDelete.join(","));
      }

      if (newImageFiles.length > 0) {
        newImageFiles.forEach((f) => formData.append("images", f));
      }

      await campAPI.updateCamp(id!, formData);
      setSuccessMessage("Camp updated successfully!");
      setTimeout(() => navigate(`/showCamp/${id}`), 1500);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to update camp. Please try again."
        );
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Camp</CardTitle>
          <CardDescription>Update the camp information below</CardDescription>
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

              {/* Image Management */}
              <Field>
                <FieldLabel>Images</FieldLabel>

                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Current Images:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={`Image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md border"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(image)}
                            disabled={loading}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  {...register("images")}
                  onChange={(e) => {
                    register("images").onChange(e);
                    handleNewImagesChange(e);
                  }}
                  disabled={loading}
                />
                {errors.images && <FieldDescription className="text-red-500">{errors.images.message}</FieldDescription>}
                {!errors.images && <FieldDescription>Upload new images to add (max 3MB each)</FieldDescription>}

                {newImagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">New Images to Upload:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {newImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img src={preview} alt={`New ${index + 1}`} className="w-full h-24 object-cover rounded-md border border-green-500" />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            disabled={loading}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <Badge variant="secondary" className="absolute bottom-1 right-1 text-xs bg-green-500 text-white">New</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  {showTagPicker ? "Hide tag picker" : selectedTags.length > 0 ? "Edit tags" : "Add tags"}
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

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(`/showCamp/${id}`)} disabled={loading} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Updating Camp..." : "Update Camp"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
