import { useState, useEffect } from 'react';
import { Question } from '../../types';
import { MapPin, Loader } from 'lucide-react';

interface LocationData {
  latitude?: number;
  longitude?: number;
  address?: string;
  accuracy?: number;
  timestamp?: string;
  manual?: boolean;
}

interface GeoLocationQuestionProps {
  question: Question;
  onChange?: (value: any) => void;
  value?: any;
  disabled?: boolean;
}

export default function GeoLocationQuestion({
  question,
  onChange,
  value,
  disabled,
}: GeoLocationQuestionProps) {
  const settings = question.settings || {};
  const captureMode = settings.captureMode || 'both';
  const allowManualEntry = settings.allowManualEntry !== false;

  const [location, setLocation] = useState<LocationData>(value?.metadata?.location || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [manualAddress, setManualAddress] = useState(location.address || '');
  const [manualLat, setManualLat] = useState(location.latitude?.toString() || '');
  const [manualLng, setManualLng] = useState(location.longitude?.toString() || '');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const newLocation: LocationData = {
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data.display_name) {
            newLocation.address = data.display_name;
          }
        } catch (err) {
          console.error('Error fetching address:', err);
        }

        setLocation(newLocation);
        setManualLat(latitude.toString());
        setManualLng(longitude.toString());
        setManualAddress(newLocation.address || '');
        setLoading(false);

        if (onChange) {
          onChange({
            metadata: {
              location: newLocation,
            },
          });
        }
      },
      (err) => {
        setError(err.message || 'Failed to get location');
        setLoading(false);
      }
    );
  };

  const handleManualUpdate = () => {
    const newLocation: LocationData = {
      ...location,
      address: manualAddress,
      latitude: manualLat ? parseFloat(manualLat) : undefined,
      longitude: manualLng ? parseFloat(manualLng) : undefined,
      manual: true,
    };

    setLocation(newLocation);

    if (onChange) {
      onChange({
        metadata: {
          location: newLocation,
        },
      });
    }
  };

  useEffect(() => {
    if (manualAddress || manualLat || manualLng) {
      const timer = setTimeout(handleManualUpdate, 500);
      return () => clearTimeout(timer);
    }
  }, [manualAddress, manualLat, manualLng]);

  return (
    <div className="space-y-4">
      {/* Auto-detect button */}
      <div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={disabled || loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Getting location...' : 'Use Current Location'}
        </button>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Manual entry */}
      {allowManualEntry && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Or enter manually:</div>

          {(captureMode === 'address' || captureMode === 'both') && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Address</label>
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                disabled={disabled}
                placeholder="123 Main St, City, State, ZIP"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          {(captureMode === 'coordinates' || captureMode === 'both') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  disabled={disabled}
                  placeholder="37.7749"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  disabled={disabled}
                  placeholder="-122.4194"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Display current location */}
      {location.latitude && location.longitude && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-medium text-green-900">Location captured</div>
              {location.address && (
                <div className="text-green-700 mt-1">{location.address}</div>
              )}
              <div className="text-green-600 mt-1">
                Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
              {location.accuracy && (
                <div className="text-green-600 text-xs mt-1">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
