export const TAGS_BY_GROUP: Record<string, string[]> = {
  "Nature / Terrain": [
    "mountain", "forest", "jungle", "desert", "river", "lake", "beach",
    "island", "snow", "waterfall", "valley", "cliff", "hill", "canyon",
  ],
  "Camping Types": [
    "tent", "rv", "campervan", "cabin", "glamping", "treehouse",
    "eco-stay", "wild-camping", "backpacking",
  ],
  "Activities": [
    "hiking", "trekking", "fishing", "kayaking", "rafting", "rock-climbing",
    "biking", "stargazing", "bird-watching", "cycling", "bonfire", "snorkeling", "skiing",
  ],
  "Amenities": [
    "wifi", "parking", "breakfast", "pet-friendly", "toilet", "shower",
    "electricity", "drinking-water", "bbq", "restaurant", "swimming-pool",
  ],
  "Trip Type": [
    "family", "solo", "couple", "luxury", "budget", "group", "adventure", "chill", "romantic",
  ],
  "Safety / Environment": ["safe", "eco-friendly", "private", "crowd-free"],
  "Seasonal": ["summer", "winter", "monsoon"],
  "Special Features": [
    "sunset-view", "sunrise-view", "lake-view", "mountain-view",
    "beach-access", "off-road", "remote",
  ],
};

export const ALL_TAGS = Object.values(TAGS_BY_GROUP).flat();
