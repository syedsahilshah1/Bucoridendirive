import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LiveBackground from './components/LiveBackground';
import Navbar from './components/Navbar';
import AuthModal from './views/AuthModal';
import CustomerDashboard from './views/CustomerDashboard';
import DriverDashboard from './views/DriverDashboard';
import AdminDashboard from './views/AdminDashboard';
import ParcelTrackingView from './views/ParcelTrackingView';
import api from './services/api';

function MainPlatform({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'customer' | 'driver' | 'admin'>('customer');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [freeRideEligible, setFreeRideEligible] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('bucoride_token');
    if (!token) return;

    try {
      const res = await api.get('/auth/profile');
      setCurrentUser(res.data.user);
      setFreeRideEligible(res.data.free_ride_eligible);
      if (res.data.user.role === 'driver') {
        setActiveTab('driver');
      } else if (res.data.user.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('customer');
      }
    } catch (err) {
      localStorage.removeItem('bucoride_token');
      setCurrentUser(null);
      setActiveTab('customer');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Strict role separation: ensure customers only access customer dashboard, drivers only driver station
  useEffect(() => {
    if (currentUser?.role === 'customer' && activeTab !== 'customer') {
      setActiveTab('customer');
    } else if (currentUser?.role === 'driver' && activeTab !== 'driver') {
      setActiveTab('driver');
    }
  }, [currentUser, activeTab]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore
    } finally {
      localStorage.removeItem('bucoride_token');
      setCurrentUser(null);
      setActiveTab('customer');
    }
  };

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    if (user.role === 'driver') {
      setActiveTab('driver');
    } else if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('customer');
    }
  };

  const isDriverOnline = currentUser?.role === 'driver' && currentUser?.driver_profile?.is_online;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 transition-colors duration-200">
      {/* Live Animated Background */}
      <LiveBackground isDark={isDark} />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          freeRideEligible={freeRideEligible}
          driverOnline={isDriverOnline}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />

        <main className="flex-1 pb-10">
          {activeTab === 'customer' && <CustomerDashboard />}
          {activeTab === 'driver' && <DriverDashboard />}
          {activeTab === 'admin' && <AdminDashboard />}
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/85 backdrop-blur py-3 text-center text-[11px] text-slate-400 transition-colors">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-yellow-400">BUCORIDE</span>
              <span className="text-slate-600">•</span>
              <span>Kenya Ride-Hailing & Parcel Delivery</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="text-yellow-400/90 font-medium">Bolt Benchmark Engine</span>
              <span>•</span>
              <span>M-Pesa STK Subscriptions</span>
              <span>•</span>
              <span>Device Fingerprint Security</span>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    localStorage.setItem('bucoride_theme', 'dark');
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      if (next === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('bucoride_theme', next);
      return next;
    });
  };

  return (
    <Router>
      <Routes>
        <Route path="/track/:token" element={<ParcelTrackingView />} />
        <Route
          path="/*"
          element={<MainPlatform isDark={theme === 'dark'} onToggleTheme={toggleTheme} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
