import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Car,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import api from '../services/api';
import InteractiveMap from '../components/InteractiveMap';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [deviceLogs, setDeviceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'pricing' | 'anti_abuse'>('overview');
  const [message, setMessage] = useState<string | null>(null);

  // Pricing Form State
  const [motoBase, setMotoBase] = useState('50');
  const [motoKm, setMotoKm] = useState('25');
  const [motoMin, setMotoMin] = useState('2.5');
  const [motoMinFare, setMotoMinFare] = useState('80');

  const [carBase, setCarBase] = useState('150');
  const [carKm, setCarKm] = useState('45');
  const [carMin, setCarMin] = useState('5.0');
  const [carMinFare, setCarMinFare] = useState('200');

  const fetchAdminData = async () => {
    try {
      const [dashRes, driverRes, custRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/drivers'),
        api.get('/admin/customers'),
      ]);

      setData(dashRes.data);
      setDrivers(driverRes.data.drivers || []);
      setDeviceLogs(custRes.data.device_fingerprints || []);

      const pricing = dashRes.data.pricing_settings || [];
      const moto = pricing.find((p: any) => p.vehicle_type === 'motorcycle');
      const car = pricing.find((p: any) => p.vehicle_type === 'car');
      if (moto) {
        setMotoBase(moto.base_fare);
        setMotoKm(moto.rate_per_km);
        setMotoMin(moto.rate_per_min);
        setMotoMinFare(moto.minimum_fare);
      }
      if (car) {
        setCarBase(car.base_fare);
        setCarKm(car.rate_per_km);
        setCarMin(car.rate_per_min);
        setCarMinFare(car.minimum_fare);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const toggleUserStatus = async (userId: number) => {
    try {
      const res = await api.post(`/admin/users/${userId}/toggle-status`);
      setMessage(res.data.message);
      await fetchAdminData();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleSavePricing = async (vehicleType: 'motorcycle' | 'car') => {
    try {
      const payload = vehicleType === 'motorcycle'
        ? { vehicle_type: 'motorcycle', base_fare: motoBase, rate_per_km: motoKm, rate_per_min: motoMin, minimum_fare: motoMinFare }
        : { vehicle_type: 'car', base_fare: carBase, rate_per_km: carKm, rate_per_min: carMin, minimum_fare: carMinFare };

      const res = await api.post('/admin/pricing', payload);
      setMessage(res.data.message);
      await fetchAdminData();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to save pricing configuration.');
    }
  };

  const resetFreeRide = async (userId: number) => {
    try {
      const res = await api.post(`/admin/customers/${userId}/reset-free-ride`);
      setMessage(res.data.message);
      await fetchAdminData();
    } catch (err: any) {
      setMessage('Failed to reset free ride voucher.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-maroon-600 dark:text-maroon-400 font-bold text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading Admin Station...
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const onlineFleet = data?.online_fleet || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4 animate-fade-in">
      
      {/* Alert Notification */}
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

      {/* Admin Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-maroon-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">Admin Console</h1>
              <span className="bg-maroon-500/15 text-maroon-700 dark:text-maroon-300 text-[10px] px-2 py-0.2 rounded-full font-bold">
                Governance
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Fleet management, pricing engine configurator, and device anti-abuse registry.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-maroon-600 dark:hover:text-maroon-400 transition flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Drivers</span>
            <Car className="w-3.5 h-3.5 text-maroon-600 dark:text-maroon-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {metrics?.total_drivers || 0}
          </div>
          <p className="text-[10px] text-slate-500">{metrics?.active_subscriptions || 0} active subscriptions</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Customers</span>
            <Users className="w-3.5 h-3.5 text-maroon-600 dark:text-maroon-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {metrics?.total_customers || 0}
          </div>
          <p className="text-[10px] text-emerald-500">Registered users</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Subscription Rev</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            KSh {metrics?.subscription_revenue_ksh?.toLocaleString() || 0}
          </div>
          <p className="text-[10px] text-slate-500">KSh 249 / 549 tiers</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Gross Vol</span>
            <TrendingUp className="w-3.5 h-3.5 text-maroon-600 dark:text-maroon-400" />
          </div>
          <div className="text-xl font-black text-maroon-600 dark:text-maroon-400 mt-1">
            KSh {metrics?.total_ecosystem_volume_ksh?.toLocaleString() || 0}
          </div>
          <p className="text-[10px] text-slate-500">Platform ecosystem volume</p>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'overview' ? 'bg-maroon-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Live Fleet
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'drivers' ? 'bg-maroon-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Drivers
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'pricing' ? 'bg-maroon-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Pricing
        </button>
        <button
          onClick={() => setActiveTab('anti_abuse')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'anti_abuse' ? 'bg-maroon-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Anti-Abuse
        </button>
      </div>

      {/* Overview: Live Fleet Map */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-maroon-600 dark:text-maroon-400" />
              Active Online Fleet ({onlineFleet.length} Online Drivers)
            </span>
          </div>

          <InteractiveMap
            center={[-1.286389, 36.817223]}
            zoom={12}
            driver={
              onlineFleet[0]
                ? {
                    lat: onlineFleet[0].driver_profile?.current_lat || -1.286389,
                    lng: onlineFleet[0].driver_profile?.current_lng || 36.817223,
                    name: onlineFleet[0].name,
                    vehicleType: onlineFleet[0].vehicles?.[0]?.vehicle_type,
                  }
                : undefined
            }
            height="320px"
          />
        </div>
      )}

      {/* Drivers List */}
      {activeTab === 'drivers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Driver</th>
                  <th className="p-2.5">Phone</th>
                  <th className="p-2.5">Vehicle</th>
                  <th className="p-2.5">Subscription</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {drivers.map((d: any) => {
                  const sub = d.active_subscription;
                  const v = d.vehicles?.[0];
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">{d.name}</td>
                      <td className="p-2.5">{d.phone_number}</td>
                      <td className="p-2.5">
                        <span>{v?.make_model || 'None'}</span>
                        <span className="text-[10px] text-maroon-600 dark:text-maroon-400 font-bold ml-1">({v?.plate_number || 'N/A'})</span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          sub ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-500'
                        }`}>
                          {sub ? (sub.is_trial ? 'Trial' : 'Paid') : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          d.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {d.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => toggleUserStatus(d.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                            d.is_active
                              ? 'bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white'
                              : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          {d.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pricing Engine Configurator */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🏍️</span> Motorcycle Rates (Bolt Benchmark)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500">Base Fare (KSh)</label>
                <input type="number" value={motoBase} onChange={(e) => setMotoBase(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Rate / KM (KSh)</label>
                <input type="number" value={motoKm} onChange={(e) => setMotoKm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Rate / Min (KSh)</label>
                <input type="number" value={motoMin} onChange={(e) => setMotoMin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Min Fare (KSh)</label>
                <input type="number" value={motoMinFare} onChange={(e) => setMotoMinFare(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white" />
              </div>
            </div>
            <button onClick={() => handleSavePricing('motorcycle')} className="w-full py-2 rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white font-bold text-xs transition shadow-sm">
              Save Motorcycle Rates
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🚗</span> Car Rates (Bolt Benchmark)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500">Base Fare (KSh)</label>
                <input type="number" value={carBase} onChange={(e) => setCarBase(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Rate / KM (KSh)</label>
                <input type="number" value={carKm} onChange={(e) => setCarKm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Rate / Min (KSh)</label>
                <input type="number" value={carMin} onChange={(e) => setCarMin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Min Fare (KSh)</label>
                <input type="number" value={carMinFare} onChange={(e) => setCarMinFare(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white" />
              </div>
            </div>
            <button onClick={() => handleSavePricing('car')} className="w-full py-2 rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white font-bold text-xs transition shadow-sm">
              Save Car Rates
            </button>
          </div>
        </div>
      )}

      {/* Anti-Abuse Registry */}
      {activeTab === 'anti_abuse' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Device Fingerprint Hash</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Voucher Status</th>
                  <th className="p-2.5 text-right">Reset Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deviceLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                    <td className="p-2.5 font-mono text-[11px] text-maroon-700 dark:text-maroon-300 truncate max-w-[180px]">
                      {log.device_hash}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                      {log.user ? `${log.user.name} (${log.user.phone_number})` : 'Unassigned'}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        log.free_ride_redeemed ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {log.free_ride_redeemed ? 'REDEEMED' : 'ELIGIBLE'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {log.user && (
                        <button
                          onClick={() => resetFreeRide(log.user.id)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-maroon-600 hover:text-white text-maroon-700 dark:text-maroon-300 text-[11px] font-bold"
                        >
                          Reset
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
