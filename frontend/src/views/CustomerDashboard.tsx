import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  Car,
  Gift,
  Package,
  Phone,
  CheckCircle2,
  Crosshair,
  Search,
  Edit3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import echo from '../services/echo';
import InteractiveMap from '../components/InteractiveMap';

const NAIROBI_PRESETS = [
  { name: 'Nairobi CBD (Kenyatta Ave)', lat: -1.286389, lng: 36.817223 },
  { name: 'Westlands (Sarit Centre)', lat: -1.2635, lng: 36.8028 },
  { name: 'JKIA Airport Terminal 1', lat: -1.3192, lng: 36.9275 },
  { name: 'Kilimani (Yaya Centre)', lat: -1.2932, lng: 36.7885 },
  { name: 'Karen Shopping Centre', lat: -1.3197, lng: 36.7064 },
  { name: 'Upper Hill Medical Centre', lat: -1.2995, lng: 36.8182 },
  { name: 'Roysambu (TRM Mall)', lat: -1.2185, lng: 36.8893 },
];

export const CustomerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'ride' | 'parcel'>('ride');

  // Ride Booking State
  const [pickup, setPickup] = useState(NAIROBI_PRESETS[0]);
  const [destination, setDestination] = useState(NAIROBI_PRESETS[1]);
  const [isCustomPickup, setIsCustomPickup] = useState(false);
  const [customPickupText, setCustomPickupText] = useState('');
  const [isCustomDest, setIsCustomDest] = useState(false);
  const [customDestText, setCustomDestText] = useState('');
  const [gpsDetecting, setGpsDetecting] = useState(false);

  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'car'>('motorcycle');
  const [distanceKm, setDistanceKm] = useState<number>(4.8);
  const [proposedFare, setProposedFare] = useState<string>('');
  const [fareBreakdown, setFareBreakdown] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Parcel State
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('+254');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('+254');
  const [parcelDesc, setParcelDesc] = useState('');
  const [createdParcel, setCreatedParcel] = useState<any>(null);

  // Live driver coordinates for active ride
  const [liveDriverLocation, setLiveDriverLocation] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/customer/dashboard');
      setData(res.data);
      if (res.data.active_rides?.length > 0) {
        setActiveRide(res.data.active_rides[0]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const calculateEstimate = async (dist: number, vType: 'motorcycle' | 'car') => {
    try {
      const res = await api.post('/customer/estimate-fare', {
        distance_km: dist,
        vehicle_type: vType,
      });
      setFareBreakdown(res.data);
      if (!proposedFare) {
        setProposedFare(res.data.estimated_fare.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    calculateEstimate(distanceKm, vehicleType);
  }, [distanceKm, vehicleType]);

  // Bind to Reverb for ride status & driver location
  useEffect(() => {
    if (!activeRide) return;

    const rideChannel = echo.channel(`ride.${activeRide.id}`);

    rideChannel.listen('.RideStatusUpdated', (e: any) => {
      setActiveRide(e.ride);
      if (e.ride.status === 'completed') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
    });

    rideChannel.listen('.RideNegotiated', (e: any) => {
      setActiveRide(e.ride);
      setMessage(`Negotiation update: ${e.message}`);
    });

    const driversChannel = echo.channel('drivers-live');
    driversChannel.listen('.DriverLocationUpdated', (e: any) => {
      if (activeRide.driver_id && activeRide.driver_id === e.driverId) {
        setLiveDriverLocation({
          lat: e.lat,
          lng: e.lng,
          name: e.driverName,
          vehicleType: e.vehicleType,
        });
      }
    });

    return () => {
      echo.leaveChannel(`ride.${activeRide.id}`);
      echo.leaveChannel('drivers-live');
    };
  }, [activeRide?.id]);

  const handleSelectPreset = (type: 'pickup' | 'dest', preset: any) => {
    if (type === 'pickup') {
      setPickup(preset);
      setIsCustomPickup(false);
    } else {
      setDestination(preset);
      setIsCustomDest(false);
    }
    const p1 = type === 'pickup' ? preset : pickup;
    const p2 = type === 'dest' ? preset : destination;
    const dx = (p1.lat - p2.lat) * 111.0;
    const dy = (p1.lng - p2.lng) * 111.0 * Math.cos((p1.lat * Math.PI) / 180);
    const dist = Math.max(1.5, Math.round(Math.sqrt(dx * dx + dy * dy) * 1.25 * 10) / 10);
    setDistanceKm(dist);
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected = {
          name: 'My Current Location (GPS)',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPickup(detected);
        setIsCustomPickup(false);
        setGpsDetecting(false);
        setMessage('GPS location locked as pickup point!');
        // Update customer general location on server
        api.post('/customer/update-location', {
          current_lat: pos.coords.latitude,
          current_lng: pos.coords.longitude,
          home_town: 'Detected GPS Location',
        }).catch(() => {});
      },
      (err) => {
        setGpsDetecting(false);
        setMessage('Could not get GPS location. You can select or type location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleApplyCustomLocation = async (type: 'pickup' | 'dest', text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Check if matches known landmark coordinates
    const lower = trimmed.toLowerCase();
    let lat = type === 'pickup' ? pickup.lat : destination.lat;
    let lng = type === 'pickup' ? pickup.lng : destination.lng;

    // Fast local dictionary for Kenyan & Pakistani cities
    if (lower.includes('upper hill')) { lat = -1.2995; lng = 36.8182; }
    else if (lower.includes('westlands') || lower.includes('sarit')) { lat = -1.2635; lng = 36.8028; }
    else if (lower.includes('cbd') || lower.includes('kenyatta')) { lat = -1.286389; lng = 36.817223; }
    else if (lower.includes('jkia') || lower.includes('airport')) { lat = -1.3192; lng = 36.9275; }
    else if (lower.includes('kilimani') || lower.includes('yaya')) { lat = -1.2932; lng = 36.7885; }
    else if (lower.includes('karen')) { lat = -1.3197; lng = 36.7064; }
    else if (lower.includes('roysambu') || lower.includes('trm')) { lat = -1.2185; lng = 36.8893; }
    else if (lower.includes('ngong')) { lat = -1.3619; lng = 36.6566; }
    else if (lower.includes('thika')) { lat = -1.0396; lng = 37.0900; }
    else if (lower.includes('eastleigh')) { lat = -1.2784; lng = 36.8485; }
    // Pakistan locations (for testing)
    else if (lower.includes('islamabad')) { lat = 33.6844; lng = 73.0479; }
    else if (lower.includes('rawalpindi')) { lat = 33.5651; lng = 73.0169; }
    else if (lower.includes('lahore')) { lat = 31.5204; lng = 74.3587; }
    else if (lower.includes('karachi')) { lat = 24.8607; lng = 67.0011; }
    else if (lower.includes('peshawar')) { lat = 34.0151; lng = 71.5249; }
    else if (lower.includes('faisalabad')) { lat = 31.4504; lng = 73.1350; }
    else if (lower.includes('multan')) { lat = 30.1575; lng = 71.5249; }
    else if (lower.includes('pakistan')) { lat = 30.3753; lng = 69.3451; }
    else {
      // Offset slightly to recalculate route distance
      lat += (Math.random() - 0.5) * 0.04;
      lng += (Math.random() - 0.5) * 0.04;
    }

    const locObj = { name: trimmed, lat, lng };

    if (type === 'pickup') {
      setPickup(locObj);
      setIsCustomPickup(false);
    } else {
      setDestination(locObj);
      setIsCustomDest(false);
    }

    const p1 = type === 'pickup' ? locObj : pickup;
    const p2 = type === 'dest' ? locObj : destination;
    const dx = (p1.lat - p2.lat) * 111.0;
    const dy = (p1.lng - p2.lng) * 111.0 * Math.cos((p1.lat * Math.PI) / 180);
    const dist = Math.max(1.5, Math.round(Math.sqrt(dx * dx + dy * dy) * 1.25 * 10) / 10);
    setDistanceKm(dist);

    setMessage(`${type === 'pickup' ? 'Pickup' : 'Destination'} updated to: ${trimmed}`);
  };

  const handleMapClick = (lat: number, lng: number) => {
    const locObj = {
      name: `Map Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
    };
    setDestination(locObj);
    setIsCustomDest(false);
    const dx = (pickup.lat - lat) * 111.0;
    const dy = (pickup.lng - lng) * 111.0 * Math.cos((pickup.lat * Math.PI) / 180);
    const dist = Math.max(1.5, Math.round(Math.sqrt(dx * dx + dy * dy) * 1.25 * 10) / 10);
    setDistanceKm(dist);
    setMessage(`Destination updated to map pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  const handleBookRide = async () => {
    setBookingLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/rides', {
        vehicle_type: vehicleType,
        pickup_address: pickup.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        destination_address: destination.name,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        distance_km: distanceKm,
        proposed_fare: parseFloat(proposedFare) || fareBreakdown?.estimated_fare,
      });

      setActiveRide(res.data.ride);
      setMessage('Ride requested! Auto-matching nearest eligible online driver...');
      fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to request ride.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAcceptCounter = async () => {
    if (!activeRide) return;
    try {
      const res = await api.post(`/rides/${activeRide.id}/accept`);
      setActiveRide(res.data.ride);
      setMessage('Driver counteroffer accepted! Fare locked.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Could not accept counteroffer.');
    }
  };

  const handleBookParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/parcels', {
        sender_name: senderName,
        sender_phone: senderPhone,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        parcel_description: parcelDesc,
        pickup_address: pickup.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        delivery_address: destination.name,
        delivery_lat: destination.lat,
        delivery_lng: destination.lng,
        distance_km: distanceKm,
      });
      setCreatedParcel(res.data);
      setMessage('Parcel delivery requested! Rider tracking link generated.');
      fetchDashboard();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to book parcel.');
    } finally {
      setBookingLoading(false);
    }
  };

  const freeRide = data?.free_ride_voucher;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4 animate-fade-in">
      
      {/* Alert Banner */}
      {message && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-yellow-400/40 text-yellow-300 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-white">{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[11px] text-yellow-400 hover:text-yellow-300 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Compact Free Ride Voucher Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-yellow-400/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg transition-colors">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
            <Gift className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-wide">BUCORIDE FREE RIDE OFFER</span>
              <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                freeRide?.eligible ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-yellow-400 border border-yellow-400/30'
              }`}>
                {freeRide?.eligible ? 'ELIGIBLE' : 'REDEEMED'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              New customers get <strong className="text-yellow-400 font-bold">1 free ride up to KSh 100</strong>. 1 per device & person (device fingerprint protected).
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <div className="text-base font-black text-yellow-400 tracking-wide">KSh 100 DISCOUNT</div>
          <div className="text-[11px] font-medium text-slate-400">Auto-applied at checkout</div>
        </div>
      </div>

      {/* Ongoing Ride Tracker (If Active) */}
      {activeRide && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-maroon-500/50 dark:border-maroon-500/40 shadow-md space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-maroon-700 dark:text-maroon-300 bg-maroon-500/10 px-2 py-0.5 rounded-md border border-maroon-500/20">
                ACTIVE TRIP
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Status: <span className="uppercase text-maroon-600 dark:text-maroon-400">{activeRide.status}</span>
              </h3>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Your Payable Fare:</span>
              <div className="text-2xl font-black text-maroon-600 dark:text-maroon-400">
                KSh {activeRide.customer_payable_fare || activeRide.agreed_fare || activeRide.estimated_fare}
              </div>
              {activeRide.free_ride_subsidy > 0 && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  (Includes KSh {activeRide.free_ride_subsidy} Free Ride Subsidy)
                </div>
              )}
            </div>
          </div>

          {activeRide.driver ? (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Assigned Driver:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{activeRide.driver.name}</p>
                <p className="text-maroon-600 dark:text-maroon-400 flex items-center gap-1 font-semibold mt-0.5">
                  <Phone className="w-3 h-3" />
                  <a href={`tel:${activeRide.driver.phone_number}`}>{activeRide.driver.phone_number}</a>
                </p>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Vehicle:</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {activeRide.driver.vehicles?.[0]?.make_model || 'Vehicle'}
                </p>
                <span className="inline-block px-2 py-0.2 rounded bg-maroon-500/15 text-maroon-700 dark:text-maroon-300 font-bold text-[10px] uppercase border border-maroon-500/20">
                  Plate: {activeRide.driver.vehicles?.[0]?.plate_number || 'KDA 123X'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Route Metrics:</span>
                <p className="font-bold text-slate-900 dark:text-white">{activeRide.distance_km} KM (~{activeRide.duration_min} min)</p>
                <p className="text-[10px] text-slate-500">60 KM/H Cruising Formula</p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-maroon-500/10 text-maroon-700 dark:text-maroon-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-maroon-500 animate-ping" />
              Searching for nearest eligible online drivers...
            </div>
          )}

          {activeRide.status === 'negotiating' && activeRide.counter_by === 'driver' && (
            <div className="p-3 rounded-xl bg-maroon-500/15 border border-maroon-500 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Driver Counteroffer:</span>
                <p className="text-lg font-black text-maroon-600 dark:text-maroon-400">KSh {activeRide.counter_fare}</p>
              </div>
              <button
                onClick={handleAcceptCounter}
                className="px-4 py-2 rounded-lg bg-maroon-600 hover:bg-maroon-700 text-white font-black text-xs shadow-sm"
              >
                Accept Counter
              </button>
            </div>
          )}

          <InteractiveMap
            center={[pickup.lat, pickup.lng]}
            zoom={13}
            pickup={{ lat: activeRide.pickup_lat, lng: activeRide.pickup_lng, address: activeRide.pickup_address }}
            dropoff={{ lat: activeRide.destination_lat, lng: activeRide.destination_lng, address: activeRide.destination_address }}
            driver={liveDriverLocation}
            height="280px"
          />
        </div>
      )}

      {/* Main Booking Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Booking / Parcel Card with Built-in Mode Tabs */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm transition-colors">
          
          {/* Top Service Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setTab('ride')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                tab === 'ride'
                  ? 'bg-maroon-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Request Ride
            </button>
            <button
              onClick={() => setTab('parcel')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                tab === 'parcel'
                  ? 'bg-maroon-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Send Parcel
            </button>
          </div>

          {/* Pickup & Destination (Shared for Ride and Parcel delivery) */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Pickup Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                  {tab === 'ride' ? 'Pickup Location' : 'Package Pickup Location'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={detectCurrentLocation}
                    disabled={gpsDetecting}
                    className="px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-400/30 font-bold text-[11px] flex items-center gap-1 border border-yellow-500/30 transition shadow-xs"
                  >
                    <Crosshair className={`w-3 h-3 ${gpsDetecting ? 'animate-spin' : ''}`} />
                    {gpsDetecting ? 'Locating...' : 'Use My GPS'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPickup(!isCustomPickup);
                      setCustomPickupText(pickup.name);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-[11px] flex items-center gap-1 border border-slate-300 dark:border-slate-700 transition"
                  >
                    <Edit3 className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                    {isCustomPickup ? 'Presets' : 'Type Custom'}
                  </button>
                </div>
              </div>

              {isCustomPickup ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customPickupText}
                    onChange={(e) => setCustomPickupText(e.target.value)}
                    placeholder="Enter specific address or landmark..."
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCustomLocation('pickup', customPickupText)}
                    className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shrink-0 transition shadow-sm active:scale-95"
                  >
                    Set
                  </button>
                </div>
              ) : (
                <select
                  value={pickup.name}
                  onChange={(e) => {
                    const found = NAIROBI_PRESETS.find((p) => p.name === e.target.value);
                    if (found) handleSelectPreset('pickup', found);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                >
                  {pickup.name === 'My Current Location (GPS)' && (
                    <option value="My Current Location (GPS)">📍 My Current Location (GPS Detected)</option>
                  )}
                  {NAIROBI_PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Destination Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  {tab === 'ride' ? 'Destination' : 'Parcel Delivery Address'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDest(!isCustomDest);
                    setCustomDestText(destination.name);
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-[11px] flex items-center gap-1 border border-slate-300 dark:border-slate-700 transition"
                >
                  <Edit3 className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                  {isCustomDest ? 'Presets' : 'Type Custom'}
                </button>
              </div>

              {isCustomDest ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customDestText}
                    onChange={(e) => setCustomDestText(e.target.value)}
                    placeholder="Enter destination address or landmark..."
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCustomLocation('dest', customDestText)}
                    className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shrink-0 transition shadow-sm active:scale-95"
                  >
                    Set
                  </button>
                </div>
              ) : (
                <select
                  value={destination.name}
                  onChange={(e) => {
                    const found = NAIROBI_PRESETS.find((p) => p.name === e.target.value);
                    if (found) handleSelectPreset('dest', found);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                >
                  {!NAIROBI_PRESETS.some((p) => p.name === destination.name) && (
                    <option value={destination.name}>📍 {destination.name}</option>
                  )}
                  {NAIROBI_PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {tab === 'ride' ? (
            <div className="space-y-3.5">
              
              {/* Category Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Ride Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVehicleType('motorcycle')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                      vehicleType === 'motorcycle'
                        ? 'border-maroon-600 bg-maroon-500/10 text-maroon-700 dark:text-maroon-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xl">🏍️</span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Boda Boda</div>
                      <div className="text-[10px] text-slate-500">Fast & affordable</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleType('car')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                      vehicleType === 'car'
                        ? 'border-maroon-600 bg-maroon-500/10 text-maroon-700 dark:text-maroon-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xl">🚗</span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">BUCORIDE Car</div>
                      <div className="text-[10px] text-slate-500">PSV / Chauffeur</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bolt Kenya Benchmarked Pricing */}
              {fareBreakdown && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>Road Distance:</span>
                    <strong className="text-slate-900 dark:text-white">{fareBreakdown.distance_km} KM (~{fareBreakdown.duration_min} min at 60 km/h)</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>Bolt Kenya Benchmark:</span>
                    <span>Base KSh {fareBreakdown.pricing_breakdown?.base_fare} + KSh {fareBreakdown.pricing_breakdown?.rate_per_km}/km</span>
                  </div>

                  {fareBreakdown.free_ride?.free_ride_applied && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border-t border-slate-200 dark:border-slate-800 pt-1">
                      <span>Free Ride Subsidy:</span>
                      <span>- KSh {fareBreakdown.free_ride.subsidy}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-1.5">
                    <span className="text-xs">Payable Amount:</span>
                    <span className="text-lg text-maroon-600 dark:text-maroon-400 font-black">
                      KSh {fareBreakdown.free_ride?.customer_payable ?? fareBreakdown.estimated_fare}
                    </span>
                  </div>
                </div>
              )}

              {/* Custom Fare Negotiation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Propose Your Fare (Negotiable)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">KSh</span>
                  <input
                    type="number"
                    value={proposedFare}
                    onChange={(e) => setProposedFare(e.target.value)}
                    placeholder="Offer amount"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-3 py-1.5 text-xs text-maroon-600 dark:text-maroon-400 font-black focus:border-maroon-600 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleBookRide}
                disabled={bookingLoading}
                className="w-full py-2.5 rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white font-black text-xs transition shadow-sm active:scale-98 disabled:opacity-50"
              >
                {bookingLoading ? 'Broadcasting...' : 'Request Ride'}
              </button>
            </div>
          ) : (
            /* Parcel Courier Form */
            <form onSubmit={handleBookParcel} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Sender Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sender"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Sender Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+254"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Receiver Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Receiver"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Receiver Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+254"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Package Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Small box, envelope, electronics"
                  value={parcelDesc}
                  onChange={(e) => setParcelDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">{distanceKm} KM road distance</span>
                <span className="font-bold text-maroon-600 dark:text-maroon-400">KSh {Math.round(80 + distanceKm * 25)}</span>
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-2.5 rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white font-black text-xs transition"
              >
                {bookingLoading ? 'Requesting...' : 'Dispatch Courier'}
              </button>

              {createdParcel && (
                <div className="p-2.5 rounded-xl bg-maroon-500/10 border border-maroon-500/30 text-xs space-y-1">
                  <p className="font-bold text-maroon-700 dark:text-maroon-300">Tracking Link Ready:</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {window.location.origin}/track/{createdParcel.parcel.tracking_token}
                  </p>
                </div>
              )}
            </form>
          )}

        </div>

        {/* Right Side: Map neatly sized */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span className="text-slate-300">Pickup: <strong className="text-white">{pickup.name}</strong></span>
              <span className="text-slate-500">➔</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Dropoff: <strong className="text-white">{destination.name}</strong></span>
            </div>
            <span className="text-[11px] text-yellow-400/80 font-medium">
              💡 Click map to set destination
            </span>
          </div>

          <InteractiveMap
            center={[pickup.lat, pickup.lng]}
            zoom={13}
            pickup={pickup}
            dropoff={destination}
            driver={liveDriverLocation}
            onMapClick={handleMapClick}
            height="370px"
          />
        </div>

      </div>

    </div>
  );
};

export default CustomerDashboard;
