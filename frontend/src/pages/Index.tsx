import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Loading from "@/components/ui/loading";
import { ImageCard } from "../components/layout/ImageCard";
import { campAPI } from "@/api/camps";
import { TAGS_BY_GROUP } from "@/lib/tags";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Price ↑", value: "price-asc" },
  { label: "Price ↓", value: "price-desc" },
];

const LIMIT = 9;

export default function Index() {
  const navigate = useNavigate();
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search — also resets page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCamps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sortMap: Record<string, { sortBy: string; sortOrder: string }> = {
        newest: { sortBy: "createdAt", sortOrder: "desc" },
        oldest: { sortBy: "createdAt", sortOrder: "asc" },
        "price-asc": { sortBy: "cost", sortOrder: "asc" },
        "price-desc": { sortBy: "cost", sortOrder: "desc" },
      };
      const { sortBy, sortOrder } = sortMap[sort] ?? sortMap.newest;
      const params: Record<string, any> = { page, limit: LIMIT, sortBy, sortOrder };
      if (debouncedSearch) params.search = debouncedSearch;
      if (minCost) params.minCost = minCost;
      if (maxCost) params.maxCost = maxCost;
      if (selectedTags.length > 0) params.tags = selectedTags.join(",");
      const data = await campAPI.getCamps(params);
      setCamps(Array.isArray(data.camps) ? data.camps : Array.isArray(data) ? data : []);
      setTotalPages(data.pages ?? data.totalPages ?? 1);
    } catch {
      setError("Failed to fetch camps");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, minCost, maxCost, selectedTags, sort]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  const toggleTag = (tag: string) => {
    setPage(1);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setMinCost("");
    setMaxCost("");
    setSelectedTags([]);
    setSort("newest");
    setPage(1);
  };

  const hasActiveFilters =
    search || minCost || maxCost || selectedTags.length > 0 || sort !== "newest";

  if (loading && page === 1 && camps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Camps</h1>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search camps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-1 flex-wrap">
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={sort === opt.value ? "default" : "outline"}
              onClick={() => { setSort(opt.value); setPage(1); }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filter toggle */}
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          {showFilters ? "Hide Filters" : "Filters"}
          {(selectedTags.length > 0 || minCost || maxCost) && (
            <span className="ml-2 inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full h-4 w-4 text-[10px] font-bold">
              {selectedTags.length + (minCost ? 1 : 0) + (maxCost ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border border-border rounded-lg p-4 mb-6 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Price range (₹/night)</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minCost}
                onChange={(e) => { setMinCost(e.target.value); setPage(1); }}
                className="w-28"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxCost}
                onChange={(e) => { setMaxCost(e.target.value); setPage(1); }}
                className="w-28"
              />
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Tags</p>
            <div className="space-y-3">
              {Object.entries(TAGS_BY_GROUP).map(([group, tags]) => (
                <div key={group}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    {group}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none ${
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
          </div>
        </div>
      )}

      {/* Active tag chips (when filter panel is closed) */}
      {selectedTags.length > 0 && !showFilters && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-semibold"
            >
              {tag}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Loading spinner during pagination */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      )}

      {/* Empty state */}
      {!loading && camps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <p className="text-lg">No camps found</p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Camp grid */}
      {!loading && camps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {camps.map((camp, index) => (
            <ImageCard
              key={camp._id || index}
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

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
