import React from 'react';
import { Shield, Car, User, LogOut, Sun, Moon, PhoneCall } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'driver' | 'admin';
  phone_number: string;
  free_ride_redeemed?: boolean;
}

interface NavbarProps {
  currentUser: UserData | null;
  activeTab: 'customer' | 'driver' | 'admin';
  setActiveTab: (tab: 'customer' | 'driver' | 'admin') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  freeRideEligible?: boolean;
  driverOnline?: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  freeRideEligible = true,
  driverOnline = false,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-[9999] backdrop-blur-md bg-slate-950/90 border-b border-slate-800/80 transition-colors shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('customer')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm ring-1 ring-yellow-400/40">
            B
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-white">
              BUCO<span className="text-yellow-400">RIDE</span>
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider bg-yellow-400/10 text-yellow-400 border border-yellow-400/25 px-1.5 py-0.2 rounded-md">
              Kenya
            </span>
          </div>
        </div>

        {/* Role-Restricted Dashboard Navigation */}
        {(!currentUser || currentUser.role === 'admin') ? (
          <nav className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'customer'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Customer
              {freeRideEligible && (
                <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  KSh 100 Free
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('driver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'driver'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Driver Station
              {currentUser?.role === 'driver' && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    driverOnline ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          </nav>
        ) : currentUser.role === 'customer' ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-bold text-yellow-400">
            <User className="w-3.5 h-3.5 text-yellow-400" />
            <span>Customer Portal</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-medium">Live Map & Booking</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-bold text-yellow-400">
            <Car className="w-3.5 h-3.5 text-yellow-400" />
            <span>Driver Station</span>
            <span className="text-slate-600">•</span>
            <span className={`flex items-center gap-1 font-semibold text-[11px] ${driverOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${driverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              {driverOnline ? 'Online - Live Orders' : 'Offline'}
            </span>
          </div>
        )}

        {/* Right Section: Theme Toggle + Auth */}
        <div className="flex items-center gap-2">
          
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-yellow-400 transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                  {currentUser.name.split(' ')[0]}
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-yellow-400/15 text-yellow-400 font-bold border border-yellow-400/25">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                  <PhoneCall className="w-2.5 h-2.5 text-yellow-400" />
                  {currentUser.phone_number}
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs transition shadow-sm active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher (Only for Admin or Guest) */}
      {(!currentUser || currentUser.role === 'admin') && (
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950 py-1.5 px-2">
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
              activeTab === 'customer' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => setActiveTab('driver')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
              activeTab === 'driver' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
            }`}
          >
            Driver
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
              activeTab === 'admin' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
            }`}
          >
            Admin
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
