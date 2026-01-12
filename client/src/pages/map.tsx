import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation as NavigationIcon, AlertCircle, Plus, Clock, Eye, Search } from 'lucide-react';
import type { Spot } from '@shared/schema';
import { AddSpotModal } from '../components/map/AddSpotModal';
import { SpotDetailModal } from '../components/map/SpotDetailModal';
import Navigation from '../components/Navigation';
import { SpotMap } from '../components/SpotMap';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance, getProximity } from '../lib/distance';

type SkateSpot = Spot;
type SpotWithDistance = Spot & {
  distance?: number | null;
  proximity?: 'here' | 'nearby' | 'far' | null;
};

export default function MapPage() {
  const { toast } = useToast();
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [isAddSpotOpen, setIsAddSpotOpen] = useState(false);
  const geolocation = useGeolocation(true);

  // Fetch spots from database
  const { data: spots = [] } = useQuery<SkateSpot[]>({
    queryKey: ['/api/spots'],
  });

  // Calculate distances and add to spots
  const spotsWithDistance: SpotWithDistance[] = spots.map(spot => {
    if (geolocation.latitude !== null && geolocation.longitude !== null) {
      const distance = calculateDistance(
        geolocation.latitude,
        geolocation.longitude,
        spot.lat,
        spot.lng
      );
      return { ...spot, distance, proximity: getProximity(distance) };
    }
    return { ...spot, distance: null, proximity: null };
  });

  // Show toast for geolocation errors with specific messaging
  useEffect(() => {
    if (geolocation.status === 'denied') {
      toast({
        title: 'Location Access Denied',
        description: 'You can still browse spots, but check-ins require location access.',
        variant: 'destructive',
        duration: 8000,
      });
    } else if (geolocation.status === 'timeout') {
      toast({
        title: 'Location Timed Out',
        description: 'Getting your location took too long. Try again or browse without location.',
        duration: 6000,
      });
    } else if (geolocation.status === 'error' && geolocation.error) {
      toast({
        title: 'Location Unavailable',
        description: geolocation.error,
        duration: 5000,
      });
    }
  }, [geolocation.status, geolocation.error, toast]);

  return (
    <div className="h-dvh flex flex-col bg-[#181818] overflow-hidden">
      <Navigation />
      
      {/* Full-screen map */}
      <div className="flex-1 relative min-h-0">
        <SpotMap
          spots={spotsWithDistance}
          userLocation={
            geolocation.latitude !== null && geolocation.longitude !== null
              ? { lat: geolocation.latitude, lng: geolocation.longitude, accuracy: geolocation.accuracy }
              : null
          }
          selectedSpotId={selectedSpotId}
          onSelectSpot={(spotId) => {
            setSelectedSpotId(spotId);
          }}
        />

        {/* Add Spot Button */}
        <div className="absolute bottom-24 right-4 z-[1000] pb-safe">
          <Button
            onClick={() => setIsAddSpotOpen(true)}
            className="shadow-lg bg-[#ff6a00] hover:bg-[#ff6a00]/90 text-white font-semibold h-14 px-6"
            data-testid="button-add-spot-mode"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Spot
          </Button>
        </div>

        {/* Add Spot Modal */}
        <AddSpotModal
          isOpen={isAddSpotOpen}
          onClose={() => setIsAddSpotOpen(false)}
          userLocation={
            geolocation.latitude !== null && geolocation.longitude !== null
              ? { lat: geolocation.latitude, lng: geolocation.longitude }
              : null
          }
        />

        {/* Floating header */}
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
          <Card className="bg-black/80 border-gray-600 backdrop-blur-md pointer-events-auto">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#fafafa] flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-[#ff6a00]" />
                    Skate Spots
                  </h1>
                  {geolocation.status === 'ready' && spotsWithDistance.length === 0 && (
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Search className="w-3 h-3" />
                      No spots nearby yet. Drop a pin to add one!
                    </p>
                  )}
                  {geolocation.status === 'ready' && spotsWithDistance.length > 0 && (
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <NavigationIcon className="w-3 h-3" />
                      {spotsWithDistance.filter(s => s.proximity === 'here').length} spots in check-in range
                    </p>
                  )}
                  {geolocation.status === 'locating' && (
                    <p className="text-sm text-gray-400">Finding your location...</p>
                  )}
                  {geolocation.status === 'browse' && (
                    <p className="text-sm text-blue-400 flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3" />
                      Browse mode - check-ins disabled
                    </p>
                  )}
                  {geolocation.status === 'denied' && (
                    <p className="text-sm text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      Location denied
                    </p>
                  )}
                  {geolocation.status === 'timeout' && (
                    <p className="text-sm text-orange-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      Location timed out
                    </p>
                  )}
                  {geolocation.status === 'error' && (
                    <p className="text-sm text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      Location unavailable
                    </p>
                  )}
                </div>
                {(geolocation.status === 'denied' || geolocation.status === 'timeout' || geolocation.status === 'error') && (
                  <div className="flex gap-2">
                    <Button
                      onClick={geolocation.retry}
                      variant="outline"
                      size="sm"
                      className="border-[#ff6a00] text-[#ff6a00] hover:bg-[#ff6a00] hover:text-white"
                      data-testid="button-retry-location"
                    >
                      Retry
                    </Button>
                    <Button
                      onClick={geolocation.browseWithoutLocation}
                      variant="outline"
                      size="sm"
                      className="border-gray-500 text-gray-400 hover:bg-gray-700 hover:text-white"
                      data-testid="button-browse-mode"
                    >
                      Browse
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Spot Detail Modal */}
      <SpotDetailModal
        spotId={selectedSpotId}
        isOpen={selectedSpotId !== null}
        onClose={() => setSelectedSpotId(null)}
        userLocation={
          geolocation.latitude !== null && geolocation.longitude !== null
            ? { lat: geolocation.latitude, lng: geolocation.longitude }
            : null
        }
      />
    </div>
  );
}
