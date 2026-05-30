import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { campAPI } from '@/api/camps';
import Loading from '@/components/ui/loading';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function IndexMap() {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [camps, setCamps] = useState<any[]>([]);
  const [campsLoaded, setCampsLoaded] = useState(false);

  // Fetch camps with coordinates
  useEffect(() => {
    campAPI.getCamps({ limit: 100 })
      .then((data) => {
        const all = Array.isArray(data.camps) ? data.camps : Array.isArray(data) ? data : [];
        const withCoords = all.filter((c: any) =>
          c.geometry?.coordinates &&
          Array.isArray(c.geometry.coordinates) &&
          c.geometry.coordinates.length === 2 &&
          typeof c.geometry.coordinates[0] === 'number' &&
          typeof c.geometry.coordinates[1] === 'number'
        );
        setCamps(withCoords);
        setCampsLoaded(true);
      })
      .catch(() => {
        setCampsLoaded(true);
      });
  }, []);

  // Initialize map once camps are loaded
  useEffect(() => {
    if (!campsLoaded || !mapContainer.current || map.current) return;

    if (!mapboxgl.accessToken) {
      setError('Mapbox token not configured');
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [78.9629, 20.5937],
        zoom: 4,
      });

      map.current.on('load', () => {
        camps.forEach((camp) => {
          const coords = camp.geometry.coordinates as [number, number];

          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 25,
          }).setHTML(
            `<div style="padding:8px 12px;font-weight:600;color:#333;min-width:140px;">
              <div>${camp.title}</div>
              ${camp.cost ? `<div style="font-size:12px;color:#666;margin-top:2px;">₹${camp.cost}/night</div>` : ''}
              ${camp.location ? `<div style="font-size:11px;color:#888;margin-top:1px;">${camp.location}</div>` : ''}
            </div>`
          );

          const marker = new mapboxgl.Marker({ color: 'hsl(var(--primary))' })
            .setLngLat(coords)
            .addTo(map.current!);

          markers.current.push(marker);

          const el = marker.getElement();
          el.style.cursor = 'pointer';

          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.2)';
            el.style.transition = 'transform 0.2s';
            popup.setLngLat(coords).addTo(map.current!);
          });

          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            popup.remove();
          });

          el.addEventListener('click', () => {
            navigate(`/showCamp/${camp._id}`);
          });
        });
      });

      map.current.on('error', () => {
        // Tile load errors are non-critical
      });
    } catch {
      setError('Failed to initialize map');
    }

    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [campsLoaded, camps, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">
        Explore Camps Worldwide
      </h1>

      <Card className="overflow-hidden shadow-lg dark:shadow-neutral-900/50">
        <CardContent className="p-0">
          {error ? (
            <div className="w-full h-[550px] flex items-center justify-center bg-muted/30">
              <div className="text-center px-4">
                <p className="text-muted-foreground text-lg mb-2">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Add VITE_MAPBOX_TOKEN to your .env file and restart the dev server
                </p>
              </div>
            </div>
          ) : !campsLoaded ? (
            <div className="w-full h-[550px] flex items-center justify-center">
              <Loading />
            </div>
          ) : (
            <div ref={mapContainer} className="w-full h-[550px]" />
          )}
        </CardContent>
      </Card>

      {campsLoaded && camps.length === 0 && !error && (
        <p className="text-center text-muted-foreground mt-4 text-sm">
          No camps with location data. Add coordinates when creating a camp to see it here.
        </p>
      )}
    </div>
  );
}
