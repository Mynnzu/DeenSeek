import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Sun, Moon, Sparkles, BookOpen } from 'lucide-react';
import { getPrayerTimes, PrayerTimeResult, formatTime } from '../services/prayerTimesService';
import { motion } from 'motion/react';

export const PrayerTimesCard: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimeResult | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const result = getPrayerTimes(latitude, longitude);
        setTimes(result);
        
        // Try to get location name
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.state;
          if (city) setLocationName(city);
        } catch (e) {
          console.error("Failed to fetch location name", e);
        }
        
        setLoading(false);
      },
      (err) => {
        setError("Please enable location access to see prayer times");
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-2xl"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-1/4"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex justify-between items-center h-12 bg-slate-50/50 rounded-2xl px-4">
              <div className="w-20 h-4 bg-slate-100 rounded"></div>
              <div className="w-16 h-4 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 text-rose-900">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-100 rounded-xl">
            <MapPin className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="font-bold">Location Required</h3>
        </div>
        <p className="text-sm text-rose-700/80 leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!times) return null;

  const prayers = [
    { name: 'Fajr', time: times.fajr, icon: Sun },
    { name: 'Sunrise', time: times.sunrise, icon: Sun },
    { name: 'Dhuhr', time: times.dhuhr, icon: Clock },
    { name: 'Asr', time: times.asr, icon: Clock },
    { name: 'Maghrib', time: times.maghrib, icon: Moon },
    { name: 'Isha', time: times.isha, icon: Moon },
  ];

  const now = new Date();
  const nextPrayerIndex = prayers.findIndex(p => p.name !== 'Sunrise' && p.time > now);
  const currentNextPrayer = nextPrayerIndex !== -1 ? prayers[nextPrayerIndex] : prayers[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#064e3b] rounded-xl flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Prayer Times</h3>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                <MapPin className="w-2.5 h-2.5" />
                {locationName || "Detecting..."}
              </div>
            </div>
          </div>
          <div className="px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Today</span>
          </div>
        </div>

        <div className="space-y-1">
          {prayers.map((p) => {
            const isNext = p.name === currentNextPrayer.name;
            const isSunrise = p.name === 'Sunrise';
            const Icon = p.icon;
            
            return (
              <motion.div 
                key={p.name}
                {...(isNext ? {
                  animate: {
                    backgroundColor: ["rgba(6, 78, 59, 1)", "rgba(10, 105, 80, 1)", "rgba(6, 78, 59, 1)"],
                  },
                  transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                } : {})}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                  isNext 
                    ? 'text-white shadow-md shadow-[#064e3b]/10' 
                    : isSunrise
                    ? 'bg-amber-50/30 text-amber-900/60'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isNext && (
                  <motion.div
                    className="absolute inset-0 bg-[#064e3b]/25 rounded-2xl -z-10"
                    animate={{
                      scale: [1, 1.04, 1],
                      opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    isNext ? 'bg-white/20' : 'bg-slate-50'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${isNext ? 'text-white' : isSunrise ? 'text-amber-500' : 'text-slate-400'}`} />
                  </div>
                  <span className={`text-xs font-semibold ${isNext ? 'text-white' : 'text-slate-700'}`}>
                    {p.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold tabular-nums ${isNext ? 'text-white' : 'text-slate-900'}`}>
                    {formatTime(p.time)}
                  </span>
                  {isNext && (
                    <Sparkles className="w-3 h-3 text-white/80 animate-pulse" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <div className="px-5 py-3 bg-[#fdfcf7] border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
          <BookOpen className="w-3 h-3 text-[#064e3b]" />
          <span>Next: {currentNextPrayer.name}</span>
        </div>
        <p className="text-[10px] font-mono text-slate-400">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
      </div>
    </motion.div>
  );
};
