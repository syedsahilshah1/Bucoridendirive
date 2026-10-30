import React, { useState, useEffect } from 'react';
import {
  Power,
  Navigation,
  Car,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Package,
  Sparkles,
  Phone,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import api from '../services/api';
import echo from '../services/echo';
import InteractiveMap from '../components/InteractiveMap';

export const DriverDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [counterAmount, setCounterAmount] = useState<string>('');
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [incomingParcel, setIncomingParcel] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Map & Order Exploration State
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-1.286389, 36.817223]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/driver/dashboard');
      setData(res.data);
      if (res.data.profile?.current_lat && res.data.profile?.current_lng) {
        setMapCenter([res.data.profile.current_lat, res.data.profile.current_lng]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchDriverLocation = () => {
    const q = mapSearchQuery.trim().toLowerCase();
    if (!q) return;

    if (q.includes('westland') || q.includes('sarit')) {
      setMapCenter([-1.2635, 36.8028]);
      setMessage('Map focused on Westlands');
    } else if (q.includes('cbd') || q.includes('kenyatta')) {
      setMapCenter([-1.286389, 36.817223]);
      setMessage('Map focused on Nairobi CBD');
    } else if (q.includes('jkia') || q.includes('airport')) {
      setMapCenter([-1.3192, 36.9275]);
      setMessage('Map focused on JKIA Airport');
    } else if (q.includes('kilimani') || q.includes('yaya')) {
      setMapCenter([-1.2932, 36.7885]);
      setMessage('Map focused on Kilimani');
    } else if (q.includes('karen')) {
      setMapCenter([-1.3197, 36.7064]);
      setMessage('Map focused on Karen');
    } else if (q.includes('upper hill')) {
      setMapCenter([-1.2995, 36.8182]);
      setMessage('Map focused on Upper Hill');
    } else if (q.includes('roysambu') || q.includes('trm')) {
      setMapCenter([-1.2185, 36.8893]);
      setMessage('Map focused on Roysambu');
    } else if (q.includes('islamabad')) {
      setMapCenter([33.6844, 73.0479]);
      setMessage('Map focused on Islamabad, Pakistan');
    } else if (q.includes('rawalpindi')) {
      setMapCenter([33.5651, 73.0169]);
      setMessage('Map focused on Rawalpindi, Pakistan');
    } else if (q.includes('lahore')) {
      setMapCenter([31.5204, 74.3587]);
      setMessage('Map focused on Lahore, Pakistan');
    } else if (q.includes('karachi')) {
      setMapCenter([24.8607, 67.0011]);
      setMessage('Map focused on Karachi, Pakistan');
    } else if (q.includes('peshawar')) {
      setMapCenter([34.0151, 71.5249]);
      setMessage('Map focused on Peshawar, Pakistan');
    } else if (q.includes('pakistan')) {
      setMapCenter([30.3753, 69.3451]);
      setMessage('Map focused on Pakistan');
    } else {
      setMessage(`Searching area "${q}" on map...`);
    }
  };

  const availableRides = (data?.available_rides || []).map((ride: any) => ({
    id: ride.id,
    type: 'ride',
    lat: Number(ride.pickup_lat),
    lng: Number(ride.pickup_lng),
    customer_name: ride.customer?.name || 'Customer',
    customer_phone: ride.customer?.phone_number || '',
    pickup_address: ride.pickup_address,
    destination_address: ride.destination_address,
    estimated_fare: ride.estimated_fare,
    proposed_fare: ride.proposed_fare,
  }));

  const availableParcels = (data?.available_parcels || []).map((parcel: any) => ({
    id: parcel.id,
    type: 'parcel',
    lat: Number(parcel.pickup_lat),
    lng: Number(parcel.pickup_lng),
    customer_name: `Sender: ${parcel.sender_name} ➔ ${parcel.receiver_name}`,
    customer_phone: parcel.sender_phone || parcel.receiver_phone || '',
    pickup_address: parcel.pickup_address,
    destination_address: parcel.delivery_address,
    estimated_fare: parcel.estimated_fare,
    proposed_fare: parcel.estimated_fare,
    parcel_desc: parcel.parcel_description,
  }));

  const availableOrderList = [...availableRides, ...availableParcels];

  useEffect(() => {
    fetchDashboard();

    const broadcastChannel = echo.channel('drivers-broadcast');

    broadcastChannel.listen('.RideRequested', (e: any) => {
      setIncomingRide(e.ride);
    });

    broadcastChannel.listen('.RideStatusUpdated', (e: any) => {
      if (incomingRide && incomingRide.id === e.ride.id && e.ride.status !== 'requested') {
        setIncomingRide(null);
      }
      fetchDashboard();
    });

    broadcastChannel.listen('.ParcelStatusUpdated', (e: any) => {
      if (e.parcel.status === 'pending') {
        setIncomingParcel(e.parcel);
      }
      fetchDashboard();
    });

    return () => {
      echo.leaveChannel('drivers-broadcast');
    };
  }, []);

  const toggleOnline = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/driver/toggle-online');
      setMessage(res.data.message);
      await fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to toggle status.');
    } finally {
      setActionLoading(false);
    }
  };

  const activateTrial = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/driver/activate-trial');
      setMessage(res.data.message);
      await fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to activate trial.');
    } finally {
      setActionLoading(false);
    }
  };

  const triggerSimulation = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/driver/simulate-opportunity');
      setMessage(res.data.message);
      await fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Must be online to simulate opportunities.');
    } finally {
      setActionLoading(false);
    }
  };

  const acceptRide = async (rideId: number) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/rides/${rideId}/accept`);
      setIncomingRide(null);
      setMessage(res.data.message);
      await fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Could not accept ride.');
    } finally {
      setActionLoading(false);
    }
  };

  const counterFare = async (rideId: number) => {
    if (!counterAmount) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/rides/${rideId}/counter`, {
        counter_fare: parseFloat(counterAmount),
      });
      setShowCounterModal(false);
      setMessage(res.data.message);
      await fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Counteroffer failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const updateRideStatus = async (rideId: number, status: string) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/rides/${rideId}/status`, { status });
      setMessage(res.data.message);
      await fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Status transition failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const acceptParcel = async (parcelId: number) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/parcels/${parcelId}/accept`);
      setIncomingParcel(null);
      setMessage(res.data.message);
      await fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to accept parcel.');
    } finally {
      setActionLoading(false);
    }
  };

  const updateParcelStatus = async (parcelId: number, status: string) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/parcels/${parcelId}/status`, { status });
      setMessage(res.data.message);
      await fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update parcel milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  const renewMpesa = async () => {
    const phone = prompt('Enter M-Pesa Phone Number (+254...):', data?.driver?.phone_number);
    if (!phone) return;
    try {
      setActionLoading(true);
      const vehicle = data?.driver?.vehicles?.[0];
      const vehicleType = vehicle ? vehicle.vehicle_type : 'motorcycle';
      const res = await api.post('/driver/subscription/pay', {
        phone,
        vehicle_type: vehicleType,
      });
      alert(res.data.message);
      await fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Subscription payment initiation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-maroon-600 dark:text-maroon-400 font-bold text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading Driver Station...
        </div>
      </div>
    );
  }

  const driver = data?.driver;
  const profile = data?.profile;
  const subscription = data?.subscription;
  const vehicle = driver?.vehicles?.[0];
  const isOnline = profile?.is_online;
  const activeRide = data?.active_rides?.[0];
  const activeParcel = data?.active_parcels?.[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4 animate-fade-in">
      
      {/* Alert Notifications */}
      {message && (
        <div className="p-3 rounded-xl bg-maroon-500/10 border border-maroon-500/30 text-maroon-700 dark:text-maroon-300 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-maroon-600 dark:text-maroon-400 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[11px] text-maroon-600 dark:text-maroon-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Driver Header & Online Toggle Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-maroon-500/15 border border-maroon-500 flex items-center justify-center text-xl shrink-0">
              {vehicle?.vehicle_type === 'motorcycle' ? '🏍️' : '🚗'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white">{driver?.name}</h1>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-maroon-500/15 text-maroon-700 dark:text-maroon-300 border border-maroon-500/20 uppercase">
                  {vehicle?.vehicle_type || 'Driver'} ({vehicle?.service_category || 'PSV'})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {vehicle?.make_model || 'Vehicle'} • Plate: <strong className="text-maroon-700 dark:text-maroon-400">{vehicle?.plate_number || 'N/A'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleOnline}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition shadow-sm active:scale-95 ${
                isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isOnline ? 'ONLINE • AVAILABLE' : 'OFFLINE • GO ONLINE'}
            </button>

            <button
              onClick={fetchDashboard}
              title="Refresh"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-maroon-600 dark:hover:text-maroon-400 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Status Banner */}
      {!subscription || subscription.status !== 'active' ? (
        <div className="p-3.5 sm:px-4 rounded-xl bg-maroon-500/10 border border-maroon-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-maroon-600 text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">1-Month Free Trial Subscription Available</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Activate your complimentary trial before accepting customer bookings.
              </p>
            </div>
          </div>
          <button
            onClick={activateTrial}
            disabled={actionLoading}
            className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-maroon-600 hover:bg-maroon-700 text-white font-bold text-xs shadow-sm"
          >
            Activate Free Trial
          </button>
        </div>
      ) : (
        <div className="p-3 sm:px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Active Subscription: </span>
              <span className="text-maroon-600 dark:text-maroon-400 font-bold uppercase">
                {subscription.is_trial ? '1-Month Free Trial' : `KSh ${subscription.amount}/mo`}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                Expires: {new Date(subscription.expiry_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={renewMpesa}
            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-maroon-700 dark:text-maroon-400 font-bold text-[11px] hover:bg-maroon-600 hover:text-white transition"
          >
            Renew via M-Pesa
          </button>
        </div>
      )}

      {/* Metrics Row: Scaled for 100% Zoom */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Rides Completed</span>
            <Car className="w-3.5 h-3.5 text-maroon-600 dark:text-maroon-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {data?.completed_rides_count || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Earnings</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            KSh {data?.total_earnings_ksh?.toLocaleString() || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Sample Alerts</span>
            <Sparkles className="w-3.5 h-3.5 text-maroon-600 dark:text-maroon-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {data?.sample_stats?.total_received || 0}
            <span className="text-[10px] text-rose-500 ml-1 font-normal">
              ({data?.sample_stats?.missed_count || 0} missed)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Sample Potential Value</span>
            <TrendingUp className="w-3.5 h-3.5 text-maroon-600 dark:text-maroon-400" />
          </div>
          <div className="text-xl font-black text-maroon-600 dark:text-maroon-400 mt-1">
            KSh {data?.sample_stats?.potential_earnings_ksh?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* Live Map with Location Search & Pickup Orders */}
      <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Navigation className="w-3.5 h-3.5 text-yellow-400" />
              Live Orders & Dispatch Map
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Showing live customer orders needing pickup. Click any yellow marker to see details and call passenger.
            </p>
          </div>

          {/* Location Search for Drivers */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search area (e.g. Westlands, CBD, JKIA)..."
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchDriverLocation();
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-yellow-400 outline-none"
              />
            </div>
            <button
              onClick={handleSearchDriverLocation}
              className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs shrink-0 transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Selected Customer Order Details Pill */}
        {selectedOrder && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-yellow-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase bg-yellow-400 text-slate-950 px-2 py-0.5 rounded">
                  SELECTED CUSTOMER
                </span>
                <span className="text-xs font-bold text-white">{selectedOrder.customer_name || 'Passenger'}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                From: <strong>{selectedOrder.pickup_address}</strong> ➔ To: <strong>{selectedOrder.destination_address}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedOrder.customer_phone && (
                <a
                  href={`tel:${selectedOrder.customer_phone}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold text-xs flex items-center gap-1 border border-yellow-400/30 transition"
                >
                  <Phone className="w-3 h-3 text-yellow-400" />
                  Call: {selectedOrder.customer_phone}
                </a>
              )}
              <button
                onClick={() => {
                  if (selectedOrder.type === 'parcel') {
                    acceptParcel(selectedOrder.id);
                  } else {
                    acceptRide(selectedOrder.id);
                  }
                }}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shadow-sm transition active:scale-95"
              >
                Accept {selectedOrder.type === 'parcel' ? 'Parcel' : 'Ride'} (KSh {selectedOrder.proposed_fare || selectedOrder.estimated_fare})
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <InteractiveMap
          center={mapCenter}
          zoom={13}
          driver={{
            lat: profile?.current_lat || -1.286389,
            lng: profile?.current_lng || 36.817223,
            name: driver?.name,
            vehicleType: vehicle?.vehicle_type,
          }}
          pickups={availableOrderList}
          onSelectPickup={(order) => setSelectedOrder(order)}
          pickup={activeRide ? { lat: activeRide.pickup_lat, lng: activeRide.pickup_lng, address: activeRide.pickup_address } : undefined}
          dropoff={activeRide ? { lat: activeRide.destination_lat, lng: activeRide.destination_lng, address: activeRide.destination_address } : undefined}
          height="340px"
        />
      </div>

      {/* Ongoing Ride Station */}
      {activeRide && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-maroon-500/50 dark:border-maroon-500/40 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <span className="text-[9px] font-bold uppercase text-maroon-600 dark:text-maroon-400">ACTIVE PASSENGER RIDE</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{activeRide.customer?.name}</h3>
              <p className="text-[11px] text-maroon-600 dark:text-maroon-400 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <a href={`tel:${activeRide.customer?.phone_number}`}>{activeRide.customer?.phone_number}</a>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500">Fare:</span>
              <div className="text-xl font-black text-maroon-600 dark:text-maroon-400">
                KSh {activeRide.agreed_fare || activeRide.estimated_fare}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {activeRide.status === 'accepted' && (
              <button
                onClick={() => updateRideStatus(activeRide.id, 'arrived')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-maroon-600 hover:bg-maroon-700 text-white font-bold text-xs shadow-sm"
              >
                Arrived at Pickup
              </button>
            )}
            {activeRide.status === 'arrived' && (
              <button
                onClick={() => updateRideStatus(activeRide.id, 'in_progress')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white font-bold text-xs shadow-sm"
              >
                Start Journey
              </button>
            )}
            {activeRide.status === 'in_progress' && (
              <button
                onClick={() => updateRideStatus(activeRide.id, 'completed')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-bold text-xs shadow-sm"
              >
                Complete Ride (Collect KSh {activeRide.customer_payable_fare})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Parcel */}
      {activeParcel && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-maroon-600 dark:text-maroon-400" />
              Active Parcel
            </span>
            <span className="text-[10px] bg-maroon-500/15 text-maroon-700 dark:text-maroon-300 px-2 py-0.2 rounded-full font-bold uppercase">
              {activeParcel.status}
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">From: <strong>{activeParcel.pickup_address}</strong> to <strong>{activeParcel.delivery_address}</strong></p>
          <div className="flex gap-2 pt-1">
            {activeParcel.status === 'accepted' && (
              <button onClick={() => updateParcelStatus(activeParcel.id, 'collected')} className="px-3 py-1.5 rounded-lg bg-maroon-600 text-white font-bold text-xs">
                Mark Collected
              </button>
            )}
            {activeParcel.status === 'collected' && (
              <button onClick={() => updateParcelStatus(activeParcel.id, 'in_transit')} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white font-bold text-xs">
                In Transit
              </button>
            )}
            {activeParcel.status === 'in_transit' && (
              <button onClick={() => updateParcelStatus(activeParcel.id, 'delivered')} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs">
                Confirm Delivered
              </button>
            )}
          </div>
        </div>
      )}

      {/* Simulated Ride Opportunities */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-maroon-700 dark:text-maroon-300 bg-maroon-500/10 px-2 py-0.5 rounded-md">
              SAMPLE OPPORTUNITIES
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Simulated Demand Feed</h3>
          </div>
          <button
            onClick={triggerSimulation}
            disabled={actionLoading || !isOnline}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-maroon-600 hover:text-white text-maroon-700 dark:text-maroon-300 font-bold text-xs transition disabled:opacity-50"
          >
            + Generate Sample
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {data?.sample_opportunities?.slice(0, 3).map((op: any) => (
            <div key={op.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <span className="text-[9px] uppercase font-bold text-maroon-600 dark:text-maroon-400">Sample Opportunity</span>
              <p className="font-semibold text-slate-900 dark:text-white truncate">{op.pickup_address}</p>
              <p className="text-[11px] text-slate-500 truncate">To: {op.destination_address}</p>
              <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-200 dark:border-slate-800">
                <span>{op.distance_km} KM</span>
                <strong className="text-maroon-600 dark:text-maroon-400">KSh {op.estimated_fare}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incoming Ride Request Modal */}
      {incomingRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-maroon-500 rounded-2xl p-5 shadow-2xl space-y-3 text-xs">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-maroon-500 animate-ping" />
              Incoming Customer Booking!
            </h3>
            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500">From: <strong className="text-slate-900 dark:text-white">{incomingRide.pickup_address}</strong></p>
              <p className="text-slate-500">To: <strong className="text-emerald-500">{incomingRide.destination_address}</strong></p>
              <p className="text-slate-500">Distance: <strong>{incomingRide.distance_km} KM</strong></p>
              <p className="text-maroon-600 dark:text-maroon-400 font-black text-sm">Customer Offer: KSh {incomingRide.proposed_fare || incomingRide.estimated_fare}</p>
            </div>

            {showCounterModal ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Counter KSh"
                  className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                />
                <button onClick={() => counterFare(incomingRide.id)} className="px-3 py-1.5 rounded-lg bg-maroon-600 text-white font-bold">
                  Send Counter
                </button>
                <button onClick={() => setShowCounterModal(false)} className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => acceptRide(incomingRide.id)}
                  className="py-2 rounded-lg bg-maroon-600 hover:bg-maroon-700 text-white font-bold"
                >
                  Accept
                </button>
                <button
                  onClick={() => setShowCounterModal(true)}
                  className="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-maroon-600 dark:text-maroon-400 font-bold border border-maroon-500/30"
                >
                  Counter
                </button>
                <button
                  onClick={() => setIncomingRide(null)}
                  className="py-2 rounded-lg bg-rose-500/15 text-rose-500 font-bold"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incoming Parcel Modal */}
      {incomingParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-maroon-500 rounded-2xl p-4 shadow-xl space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Parcel Delivery Available</h3>
            <p className="text-slate-600 dark:text-slate-300">From {incomingParcel.pickup_address} to {incomingParcel.delivery_address}</p>
            <div className="text-maroon-600 dark:text-maroon-400 font-bold text-sm">Delivery Fee: KSh {incomingParcel.estimated_fare}</div>
            <div className="flex gap-2">
              <button onClick={() => acceptParcel(incomingParcel.id)} className="flex-1 py-2 rounded-lg bg-maroon-600 text-white font-bold">
                Accept Parcel
              </button>
              <button onClick={() => setIncomingParcel(null)} className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverDashboard;
