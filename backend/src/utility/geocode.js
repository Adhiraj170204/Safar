const geocodeLocation = async (location) => {
  const token = process.env.MAPBOX_TOKEN;
  if (!token || !location) return null;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${token}&limit=1`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data.features?.length) return null;

  const [lng, lat] = data.features[0].center;
  return { type: "Point", coordinates: [lng, lat] };
};

export { geocodeLocation };
