import React, { useState } from 'react';
import { X, User, Car, Lock, Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import api from '../services/api';
import { getDeviceFingerprint } from '../services/fingerprint';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'customer' | 'driver'>('customer');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254');
  const [password, setPassword] = useState('');
  const [homeTown, setHomeTown] = useState('Nairobi');

  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'car'>('motorcycle');
  const [serviceCategory, setServiceCategory] = useState<'private_hire' | 'psv'>('psv');
  const [vehicleModel, setVehicleModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const deviceHash = await getDeviceFingerprint();

    try {
      if (isRegister) {
        const payload: any = {
          name,
          email,
          phone_number: phone,
          password,
          role,
          home_town: homeTown,
          device_fingerprint: deviceHash,
        };

        if (role === 'driver') {
          payload.vehicle_type = vehicleType;
          payload.service_category = serviceCategory;
          payload.vehicle_model = vehicleModel;
          payload.plate_number = plateNumber;
        }

        const res = await api.post('/auth/register', payload);
        localStorage.setItem('bucoride_token', res.data.token);
        onSuccess(res.data.user);
        onClose();
      } else {
        const res = await api.post('/auth/login', {
          email,
          password,
          device_fingerprint: deviceHash,
        });
        localStorage.setItem('bucoride_token', res.data.token);
        onSuccess(res.data.user);
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : 'Authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const deviceHash = await getDeviceFingerprint();
      const res = await api.post('/auth/login', {
        email: demoEmail,
        password: 'password',
        device_fingerprint: deviceHash,
      });
      localStorage.setItem('bucoride_token', res.data.token);
      onSuccess(res.data.user);
      onClose();
    } catch (err: any) {
      setError('Demo login failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-maroon-700 to-maroon-500 text-white font-black text-xl mb-1 shadow-md ring-1 ring-white/20">
            B
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {isRegister ? 'Create Account' : 'Sign In to BUCORIDE'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isRegister ? 'Register customer or driver account' : 'Access your dashboard'}
          </p>
        </div>

        {/* Quick Demo Login Presets */}
        <div className="mb-4 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[11px] font-bold text-maroon-600 dark:text-maroon-400 mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>1-Click Demo Profiles</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoLogin('customer@bucoride.com')}
              className="py-1 px-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-maroon-600 hover:text-white transition"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('driver.boda@bucoride.com')}
              className="py-1 px-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-maroon-600 hover:text-white transition"
            >
              Boda
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('driver.car@bucoride.com')}
              className="py-1 px-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-maroon-600 hover:text-white transition"
            >
              Car
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@bucoride.com')}
              className="py-1 px-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-maroon-600 hover:text-white transition"
            >
              Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
            {error}
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 mb-3 text-xs">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-1.5 font-bold rounded-lg transition ${
              !isRegister ? 'bg-maroon-600 text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-1.5 font-bold rounded-lg transition ${
              isRegister ? 'bg-maroon-600 text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Register
          </button>
        </div>

        {isRegister && (
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                role === 'customer'
                  ? 'border-maroon-600 bg-maroon-500/10 text-maroon-700 dark:text-maroon-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                role === 'driver'
                  ? 'border-maroon-600 bg-maroon-500/10 text-maroon-700 dark:text-maroon-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Driver / Rider
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isRegister && (
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-maroon-600"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@bucoride.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-maroon-600"
            />
          </div>

          {isRegister && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+254"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-maroon-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Home Town</label>
                <input
                  type="text"
                  placeholder="Nairobi"
                  value={homeTown}
                  onChange={(e) => setHomeTown(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-maroon-600"
                />
              </div>
            </div>
          )}

          {isRegister && role === 'driver' && (
            <div className="p-3 rounded-xl bg-maroon-500/10 border border-maroon-500/20 space-y-2">
              <div className="text-[10px] font-bold text-maroon-700 dark:text-maroon-300 uppercase">Vehicle Registration</div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                </select>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="psv">PSV</option>
                  <option value="private_hire">Private Hire</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Model (e.g. Boxer)"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Plate (e.g. KDA 123X)"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white uppercase"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-maroon-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-maroon-600 hover:bg-maroon-700 text-white font-black text-xs transition shadow-sm"
          >
            {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
