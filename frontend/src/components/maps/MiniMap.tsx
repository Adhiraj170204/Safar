import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

interface MiniMapProps {
  coordinates: [number, number]; // lng, lat
  title: string;
}

// Read Mapbox token from environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function MiniMap({ coordinates, title }: MiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) {
      return;
    }
    
    if (map.current) {
      return;
    }

    // Check if token is available
    if (!mapboxgl.accessToken) {
      setError('Mapbox token not configured');
      console.error('VITE_MAPBOX_TOKEN is not set in .env file');
      setIsLoading(false);
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/standard',
        center: coordinates,
        zoom: 12,
      });

      map.current.on('load', () => {
        setIsLoading(false);
      });

      // Add marker with theme color
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat(coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25, className: 'mapbox-popup' }).setHTML(
            `<div style="color: #000; font-weight: 600; padding: 4px;">${title}</div>`
          )
        )
        .addTo(map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [coordinates, title]);

  const handleNavigate = () => {
    // Google Maps URL with coordinates
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden shadow-md dark:shadow-neutral-900/50 border-border">
        <CardContent className="p-0">
          {error ? (
            <div className="w-full h-[260px] flex items-center justify-center bg-muted/30">
              <div className="text-center px-4">
                <p className="text-muted-foreground text-sm mb-2">{error}</p>
                <p className="text-xs text-muted-foreground">
                  Add VITE_MAPBOX_TOKEN to your .env file
                </p>
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10">
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              )}
              <div 
                ref={mapContainer} 
                className="w-full h-[260px]"
                style={{ position: 'relative' }}
              />
            </>
          )}
        </CardContent>
      </Card>
      <Button 
        onClick={handleNavigate} 
        className="w-full"
        variant="default"
      >
        <Navigation className="mr-2 h-4 w-4" />
        Get Directions
      </Button>
    </div>
  );
}
