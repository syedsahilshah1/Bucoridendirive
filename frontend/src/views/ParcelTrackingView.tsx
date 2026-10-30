import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import echo from '../services/echo';
import InteractiveMap from '../components/InteractiveMap';

export const ParcelTrackingView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async () => {
    try {
      const res = await api.get(`/parcels/track/${token}`);
      setData(res.data);
    } catch (err: any) {
      setError('Parcel not found or tracking token invalid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();

    if (!token) return;

    const parcelChannel = echo.channel(`parcel.${token}`);
    parcelChannel.listen('.ParcelStatusUpdated', () => {
      fetchTracking();
    });

    return () => {
      echo.leaveChannel(`parcel.${token}`);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-yellow-400 dark:text-yellow-300 font-bold text-sm">
        Loading BUCORIDE Live Parcel Radar...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Package className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">{error || 'Unable to track parcel'}</h2>
        <p className="text-xs text-slate-500 mb-4">Please check the link provided by the sender.</p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs transition shadow-sm">
          Return to Platform
        </Link>
      </div>
    );
  }

  const parcel = data.parcel;
  const rider = data.rider_location;

  const steps = [
    { key: 'pending', label: 'Requested' },
    { key: 'accepted', label: 'Rider Assigned' },
    { key: 'collected', label: 'Collected' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === parcel.status);

  return (
    <div className="min-h-screen p-4 sm:p-6 transition-colors">
      <div className="max-w-4xl mx-auto space-y-4">
        
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-yellow-400 dark:hover:text-yellow-300 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to BUCORIDE
        </Link>

        {/* Tracking Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 dark:text-yellow-300">
                LIVE RADAR
              </span>
              <h1 className="text-base font-black text-slate-900 dark:text-white">Parcel #{token?.slice(0, 8)}</h1>
              <p className="text-xs text-slate-500">{parcel.parcel_description}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-500 uppercase">Status:</span>
            <div className="text-base font-black text-yellow-400 dark:text-yellow-300 uppercase">{parcel.status}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">KSh {parcel.estimated_fare} Fee</div>
          </div>
        </div>

        {/* Milestones Timeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-5 gap-2">
            {steps.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.key} className="text-center space-y-1">
                  <div className={`h-1.5 rounded-full transition-all ${
                    isPast ? 'bg-yellow-400' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
                  <div className={`text-[10px] font-bold ${
                    isCurrent ? 'text-yellow-400 dark:text-yellow-300' : isPast ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Map */}
        <InteractiveMap
          center={[parcel.pickup_lat, parcel.pickup_lng]}
          zoom={13}
          pickup={{ lat: parcel.pickup_lat, lng: parcel.pickup_lng, address: parcel.pickup_address }}
          dropoff={{ lat: parcel.delivery_lat, lng: parcel.delivery_lng, address: parcel.delivery_address }}
          driver={rider ? { lat: rider.lat, lng: rider.lng, name: rider.name, vehicleType: 'Motorcycle' } : undefined}
          height="320px"
        />

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-yellow-400 dark:text-yellow-300">Courier</span>
            {rider ? (
              <div className="space-y-0.5 text-slate-700 dark:text-slate-300">
                <p><strong>{rider.name}</strong> ({rider.phone})</p>
                <p>{rider.vehicle?.make_model} ({rider.vehicle?.plate_number})</p>
              </div>
            ) : (
              <p className="text-slate-500">Awaiting rider assignment...</p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-yellow-400 dark:text-yellow-300">Route</span>
            <p className="text-slate-700 dark:text-slate-300">Sender: {parcel.sender_name} • Receiver: {parcel.receiver_name}</p>
            <p className="text-slate-500 text-[11px] truncate">Delivery to: {parcel.delivery_address}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ParcelTrackingView;
