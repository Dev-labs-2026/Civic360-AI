import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';

// Custom SVG Leaflet Pin Icon
const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        <div style="position: absolute; top: 0; left: 0; width: 32px; height: 32px; background: #2563eb; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(37,99,235,0.4); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to handle map clicks
const LocationMarkerHandler = ({ position, setPosition, onLocationChange }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      if (onLocationChange) onLocationChange(lat, lng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [position, map]);

  return position ? (
    <Marker position={position} icon={createCustomPinIcon()} />
  ) : null;
};

const MapPicker = ({
  initialLat = 12.9716, // Default: Bengaluru Central
  initialLng = 77.5946,
  onLocationSelect,
  className = 'h-72',
}) => {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        if (onLocationSelect) {
          onLocationSelect(latitude, longitude);
        }
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGeoError('Could not obtain current GPS. Please click directly on the map to pin.');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMarkerChange = (lat, lng) => {
    setPosition([lat, lng]);
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div className={className}>
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarkerHandler
            position={position}
            setPosition={setPosition}
            onLocationChange={handleMarkerChange}
          />
        </MapContainer>
      </div>

      {/* Control overlay */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur text-blue-700 hover:bg-blue-50 border border-blue-200 text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Detecting GPS...' : 'Use My GPS Location'}
        </button>
      </div>

      {/* Bottom coordinate pill */}
      <div className="absolute bottom-2 left-3 z-[400] bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-700 shadow-sm border border-slate-200 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-blue-600" />
        <span>
          {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </span>
      </div>

      {geoError && (
        <div className="p-2 bg-amber-50 text-amber-800 text-xs border-t border-amber-200 text-center">
          {geoError}
        </div>
      )}
    </div>
  );
};

export default MapPicker;
