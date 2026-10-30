import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: #ffffff;
        border: 2px solid ${color};
        color: #0f172a;
        padding: 2px 7px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 10px;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        white-space: nowrap;
        transform: translate(-50%, -100%);
      ">
        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${color}"></span>
        ${label}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

const pickupIcon = createCustomIcon('#eab308', 'Pickup');
const dropoffIcon = createCustomIcon('#10b981', 'Destination');
const driverIcon = createCustomIcon('#facc15', 'Driver');

interface MapProps {
  center?: [number, number];
  zoom?: number;
  pickup?: { lat: number; lng: number; address?: string };
  dropoff?: { lat: number; lng: number; address?: string };
  driver?: { lat: number; lng: number; name?: string; vehicleType?: string };
  pickups?: Array<{
    id: number;
    lat: number;
    lng: number;
    customer_name?: string;
    customer_phone?: string;
    pickup_address: string;
    destination_address: string;
    estimated_fare?: number;
    proposed_fare?: number;
  }>;
  onSelectPickup?: (item: any) => void;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
}

function ChangeView({
  center,
  zoom,
  pickup,
  dropoff,
}: {
  center: [number, number];
  zoom: number;
  pickup?: { lat: number; lng: number };
  dropoff?: { lat: number; lng: number };
}) {
  const map = useMap();
  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng]
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, map]);
  return null;
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      if (onClick) onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const InteractiveMap: React.FC<MapProps> = ({
  center = [-1.286389, 36.817223],
  zoom = 13,
  pickup,
  dropoff,
  driver,
  pickups,
  onSelectPickup,
  onMapClick,
  height = '320px',
}) => {
  const routePoints: [number, number][] = [];
  if (pickup) routePoints.push([pickup.lat, pickup.lng]);
  if (dropoff) routePoints.push([dropoff.lat, dropoff.lng]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg transition-colors isolate z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} pickup={pickup} dropoff={dropoff} />
        {onMapClick && <MapClickHandler onClick={onMapClick} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <strong className="text-yellow-600">Pickup</strong>
              <br />
              {pickup.address || 'Selected Location'}
            </Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
            <Popup>
              <strong className="text-emerald-600">Destination</strong>
              <br />
              {dropoff.address || 'Selected Destination'}
            </Popup>
          </Marker>
        )}

        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>
              <strong className="text-yellow-600">
                {driver.name || 'BUCORIDE Driver'}
              </strong>
              <br />
              Live Location
            </Popup>
          </Marker>
        )}

        {/* Available Live Customer Orders on Map */}
        {pickups && pickups.map((req) => (
          <Marker
            key={req.id}
            position={[req.lat, req.lng]}
            icon={createCustomIcon('#eab308', `KSh ${req.proposed_fare || req.estimated_fare}`)}
            eventHandlers={{
              click: () => onSelectPickup && onSelectPickup(req),
            }}
          >
            <Popup>
              <div className="text-xs space-y-1.5 p-1 max-w-[200px]">
                <div className="font-bold text-slate-900 border-b pb-1 flex items-center justify-between">
                  <span>Customer Order</span>
                  <span className="text-yellow-600 font-black">KSh {req.proposed_fare || req.estimated_fare}</span>
                </div>
                <div className="text-[11px] text-slate-700">
                  <strong>{req.customer_name || 'Passenger'}</strong>
                </div>
                <div className="text-[10px] text-slate-600">
                  From: {req.pickup_address}
                  <br />
                  To: {req.destination_address}
                </div>
                {req.customer_phone && (
                  <div className="pt-1">
                    <a
                      href={`tel:${req.customer_phone}`}
                      className="inline-block w-full text-center py-1 rounded bg-slate-900 text-white font-bold text-[10px]"
                    >
                      📞 Call {req.customer_phone}
                    </a>
                  </div>
                )}
                {onSelectPickup && (
                  <button
                    onClick={() => onSelectPickup(req)}
                    className="w-full mt-1 py-1 rounded bg-yellow-400 text-slate-950 font-black text-[10px] hover:bg-yellow-300"
                  >
                    View & Accept Order
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {routePoints.length === 2 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#eab308',
              weight: 4,
              opacity: 0.95,
              dashArray: '6, 6',
            }}
          />
        )}
      </MapContainer>

      {/* Floating GPS badge */}
      <div className="absolute top-2.5 right-2.5 z-[1000] bg-slate-900/95 backdrop-blur border border-yellow-400/40 text-yellow-300 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
        <span>GPS Connected</span>
      </div>
    </div>
  );
};

export default InteractiveMap;
